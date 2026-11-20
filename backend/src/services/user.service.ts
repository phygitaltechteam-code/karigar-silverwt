/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '../client';
import {tokenService} from '@services/index';
import axios from 'axios';
// import emailService from '../services/email.service';
import {ApiError, encryptPassword, isPasswordMatch, pick} from '@utils/index';
import {UserProfile} from 'types/response';
import {userValidation} from '@validations/index';
import {Role, User} from '@prisma/client';
import {z} from 'zod';
import {DecodedToken} from './token.service';

type RegisterUser = z.infer<typeof userValidation.registerUserSchema>;
type LoginUser = z.infer<typeof userValidation.loginUserSchema>;
type ChangePassword = z.infer<typeof userValidation.changePasswordSchema>;
type UpdateUser = z.infer<typeof userValidation.updateUserSchema>;
type VerifyVerificationCode = z.infer<typeof userValidation.verifyVerificationCodeSchema>;

class UserService {
    private async findUserById(userId: string): Promise<User> {
        const user = await prisma.user.findUnique({where: {id: userId}});
        if (!user) throw new ApiError(404, 'User not found');
        return user;
    }

    private async buildUserObject(user: UserProfile): Promise<UserProfile> {
        if (user.role === Role.ADMIN) {
            const admin = await prisma.admin.findUnique({
                where: {userId: user.id},
                include: {user: true},
            });

            if (!admin) {
                throw new ApiError(404, 'Admin not found');
            }

            const {user: adminUser, id: adminId} = admin;

            return {
                id: adminUser.id,
                username: adminUser.phoneNumber || '',
                email: adminUser.email || '',
                fullname: adminUser.fullname,
                // plan: admin.plan,

                role: user.role,
                adminId: adminId,

                phoneNumber: adminUser.phoneNumber,
                address: adminUser.address || '',
            };
        }

        return pick(user, [
            'id',
            'username',
            'email',
            'fullname',
            'role',
            'phoneNumber',
            'address',
            // 'googleRating',
            // 'plan',
            // 'employeeRestriction',
        ]);
    }

    public async registerUser(data: RegisterUser, logo?: string, coverImage?: string) {
        // console.log('user');
        let user;
        const {fullname, email, username, password, phoneNumber, secondaryPhoneNumber, role} = data;

        const existingUser = await prisma.user.findFirst({where: {phoneNumber}});
        const verifyCode = this.generateVerificationCode();

        if (existingUser) {
            return await this.handleExistingUser(existingUser, password, verifyCode);
        } else {
            user = await this.createUser({
                fullname,
                email: email || '',
                username: username || '',
                password,
                address: data.address || '',
                verifyCode,
                phoneNumber: phoneNumber,
                secondaryPhoneNumber: secondaryPhoneNumber ?? null,
                role: role ?? Role.ADMIN,
            });
            if (role === 'ADMIN') {
                // console.log('admin');
                const admin = await prisma.admin.create({
                    data: {
                        userId: user.id,
                        amount: data.amount,
                        renewalAmount: data.renewalAmount,
                        district: data.district,
                        // openingTime: data.openingTime,
                        // title: data.title,
                        BrandColour: data.BrandColour,
                        city: data.city,
                        state: data.state,
                        country: data.country,
                        // storage: data.storage,
                        accessType: data.accessType,
                        key: data.key,
                        extendDays: data.extendDays,
                        extendKey: data.extendKey,
                        isExtendUsedKey: false,
                        // plan: 'GOLD',
                        startDate: data.startDate,
                        expiryDate: data.expiryDate,
                        coverImage: coverImage || null,
                        logo: logo || null,
                        pincode: data.pincode,
                        contactPersonName: data.contactPersonName,
                        contactPersonNumber: data.contactPersonPhone,
                        contactPersonEmail: data.contactPersonEmail,
                        shopName: data.shopName,

                        // mallName: data.mallName,
                        // shopCount: data.shopCount,
                    },
                });
                await prisma.item.create({
                    data: {
                        name: 'SILVER',
                        adminId: admin.id,
                    },
                });
            }
        }
        return user;
    }

    private generateVerificationCode(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    private async handleExistingUser(user: User, password: string, verifyCode: string) {
        if (user.isVerified) {
            throw new ApiError(409, 'User with this Phone number already exists');
        } else {
            const hashedPassword = await encryptPassword(password);
            return await prisma.user.update({
                where: {id: user.id},
                data: {
                    password: hashedPassword,
                    verifyCode,
                    verifyCodeExpiry: new Date(Date.now() + 3600000), // 1 hour
                },
            });
        }
    }

    private async createUser(
        data: Pick<
            User,
            | 'fullname'
            | 'email'
            | 'username'
            | 'password'
            | 'verifyCode'
            | 'phoneNumber'
            | 'address'
            | 'role'
            | 'secondaryPhoneNumber'
        >,
    ) {
        const hashedPassword = await encryptPassword(data.password!);
        return prisma.user.create({
            data: {
                ...data,
                password: hashedPassword,
                verifyCodeExpiry: new Date(Date.now() + 3600000), // 1 hour
                isVerified: true,
                isActive: true,
            },
        });
    }

    public async loginUser(data: LoginUser) {
        const {email, username, password} = data;
        const user = await prisma.user.findFirst({
            where: {OR: [{phoneNumber: username}, {email}]},
            include: {
                admin: true,
            },
        });
        if (!user) throw new ApiError(404, 'User does not exist');
        if (!user.isVerified)
            throw new ApiError(403, 'User account is not verified. Please verify your email!');

        if (!user.isActive)
            throw new ApiError(403, 'User account is not active. Please contact support!');
        if (user) await this.verifyPassword(password, user.password!);

        // const now = new Date();

        const checkForCateror = await this.buildUserObject(user as UserProfile);
        const {accessToken, refreshToken} = await tokenService.generateAccessAndRefreshToken({
            ...checkForCateror,
            // mallId: checkForCateror.adminId,
            // name:checkForCateror.
        });
        return {accessToken, refreshToken, user: checkForCateror};
    }

    private async verifyPassword(password: string, hashedPassword: string) {
        if (!(await isPasswordMatch(password, hashedPassword))) {
            throw new ApiError(401, 'Invalid credentials');
        }
    }

    public async logoutUser(userId: string) {
        await prisma.user.update({where: {id: userId}, data: {refreshToken: null}});
    }

    public async refreshAccessToken(refreshToken: string) {
        const decodedToken = tokenService.verifyToken(refreshToken) as DecodedToken;
        const user = await this.findUserById(decodedToken.id);

        if (refreshToken !== user.refreshToken) {
            throw new ApiError(401, 'Invalid or expired refresh token');
        }

        const checkForCateror = await this.buildUserObject(user as UserProfile);

        return tokenService.generateAccessAndRefreshToken(checkForCateror);
    }

    public async getCurrentUser(userId: string): Promise<User> {
        return this.findUserById(userId);
    }

    public async changeCurrentPassword(userId: string, data: ChangePassword) {
        const user = await this.findUserById(userId);
        await this.verifyUserVerification(user);

        await this.verifyPassword(data.currentPassword, user.password!);
        const hashedNewPassword = await encryptPassword(data.newPassword);
        return await prisma.user.update({
            where: {id: user.id},
            data: {password: hashedNewPassword},
        });
    }

    private async verifyUserVerification(user: User) {
        if (!user.isVerified) throw new ApiError(403, 'User account is not verified.');
    }

    public async updateUser(userId: string, data: UpdateUser) {
        return await prisma.user.update({
            where: {id: userId},
            data,
            select: {id: true, username: true, email: true, fullname: true},
        });
    }

    public async verifyVerificationCode(data: VerifyVerificationCode) {
        // const user = await prisma.user.findUnique({where: {username: data}});
        // if (!user) throw new ApiError(404, 'User not found');

        // await this.checkVerificationCode(user, data.code);
        // await prisma.user.update({
        //     where: {id: user.id},
        //     data: {isVerified: true, verifyCode: null, verifyCodeExpiry: null},
        // });
        console.log(data);
    }

    private async checkVerificationCode(user: User, code: string) {
        if (user.verifyCode !== code || new Date(user.verifyCodeExpiry!) <= new Date()) {
            throw new ApiError(400, 'Invalid or expired verification code');
        }
    }

    public async requestPasswordReset(email: string) {
        // const user = await prisma.user.findUnique({where: {email}});
        // if (!user) throw new ApiError(404, 'User not found');
        // await this.verifyUserVerification(user);
        console.log(email);
        // const accessToken = tokenService.generateAccessToken(user);
        // const emailResponse = await emailService.sendResetPasswordEmail(email, accessToken);
        // if (!emailResponse.success) throw new ApiError(500, emailResponse.message);
    }

    public async resetPassword(userId: string, newPassword: string) {
        const hashedPassword = await encryptPassword(newPassword);
        await prisma.user.update({where: {id: userId}, data: {password: hashedPassword}});
    }

    public async findUserByEmailOrUsername(email: string, username: string): Promise<User | null> {
        return await prisma.user.findFirst({
            where: {
                OR: [{email}, {username}],
            },
        });
    }

    public async updateUnverifiedUser(userId: string, data: Partial<User>): Promise<User> {
        if (data.password) {
            data.password = await encryptPassword(data.password);
        } else {
            delete data.password;
        }

        data.verifyCode = this.generateVerificationCode();
        data.verifyCodeExpiry = new Date(Date.now() + 3600000);
        data.isVerified = false;

        return await prisma.user.update({
            where: {id: userId},
            data,
        });
    }

    public async deactivateUser(userId: string): Promise<void> {
        await prisma.user.update({
            where: {id: userId},
            data: {
                isActive: false,
                deletedAt: new Date(),
            },
        });
    }
    async getUserInfo(key: string) {
        if (!key) {
            throw new ApiError(400, 'Key is required.');
        }

        // If running in local/offline client mode, fetch details from online server and sync locally
        if (process.env.IS_OFFLINE === 'true' || process.env.ONLINE_BACKEND_URL) {
            const onlineUrl =
                process.env.ONLINE_BACKEND_URL || 'https://backend.chain.phygitaltech.in';
            try {
                const response = await axios.post(`${onlineUrl}/api/v1/user/user-info`, {key});
                const adminData = response.data?.data;

                if (!adminData) {
                    throw new ApiError(404, 'Invalid key or admin data not found on the server.');
                }

                // Sync User details locally
                await prisma.user.upsert({
                    where: {id: adminData.user.id},
                    update: {
                        username: adminData.user.username,
                        email: adminData.user.email,
                        fullname: adminData.user.fullname,
                        phoneNumber: adminData.user.phoneNumber,
                        role: adminData.user.role,
                        isActive: adminData.user.isActive,
                    },
                    create: {
                        id: adminData.user.id,
                        username: adminData.user.username,
                        email: adminData.user.email,
                        fullname: adminData.user.fullname,
                        phoneNumber: adminData.user.phoneNumber,
                        role: adminData.user.role,
                        isActive: adminData.user.isActive,
                    },
                });

                // Sync Admin details locally
                const localAdmin = await prisma.admin.upsert({
                    where: {id: adminData.id},
                    update: {
                        userId: adminData.userId,
                        amount: adminData.amount,
                        accessType: adminData.accessType,
                        city: adminData.city,
                        state: adminData.state,
                        country: adminData.country,
                        logo: adminData.logo,
                        coverImage: adminData.coverImage,
                        key: adminData.key,
                        isUsedKey: adminData.isUsedKey,
                        extendDays: adminData.extendDays,
                        extendKey: adminData.extendKey,
                        isExtendUsedKey: adminData.isExtendUsedKey,
                        startDate: adminData.startDate ? new Date(adminData.startDate) : null,
                        expiryDate: adminData.expiryDate ? new Date(adminData.expiryDate) : null,
                    },
                    create: {
                        id: adminData.id,
                        userId: adminData.userId,
                        amount: adminData.amount,
                        accessType: adminData.accessType,
                        city: adminData.city,
                        state: adminData.state,
                        country: adminData.country,
                        logo: adminData.logo,
                        coverImage: adminData.coverImage,
                        extendDays: adminData.extendDays,
                        extendKey: adminData.extendKey,
                        isExtendUsedKey: adminData.isExtendUsedKey,
                        key: adminData.key,
                        isUsedKey: adminData.isUsedKey,
                        startDate: adminData.startDate ? new Date(adminData.startDate) : null,
                        expiryDate: adminData.expiryDate ? new Date(adminData.expiryDate) : null,
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                email: true,
                                fullname: true,
                                phoneNumber: true,
                                role: true,
                                isActive: true,
                            },
                        },
                    },
                });

                return localAdmin;
            } catch (error: any) {
                if (error.response && error.response.data) {
                    throw new ApiError(
                        error.response.status || 500,
                        error.response.data.message || 'Error from online server',
                    );
                }
                throw new ApiError(500, error.message || 'Failed to connect to the online server.');
            }
        }

        // Online mode: Verify key against local PostgreSQL and mark as used
        const admin = await prisma.admin.findFirst({
            where: {key: key},
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        fullname: true,
                        phoneNumber: true,
                        role: true,
                        isActive: true,
                    },
                },
            },
        });
        if (!admin) {
            throw new ApiError(404, 'Key not found.');
        }
        if (admin.isUsedKey) {
            throw new ApiError(400, 'Key already used.');
        }
        return await prisma.admin.update({
            where: {id: admin.id},
            data: {isUsedKey: true},
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        fullname: true,
                        phoneNumber: true,
                        role: true,
                        isActive: true,
                    },
                },
            },
        });
    }
}

export default new UserService();
