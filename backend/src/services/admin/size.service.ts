// import {Prisma, Role} from '@prisma/client';
// import prisma from '../../client';
// import {ApiError, encryptPassword} from '@utils/index';
// import {shopValidation} from '@validations/index';
// import httpStatus from 'http-status';
// import {z} from 'zod';
// import {userService} from '@services/index';

// type AddshopData = z.infer<typeof shopValidation.registershopSchema>;
// type UpdateshopData = z.infer<typeof shopValidation.updateshopSchema>;
// type OffersStatusData = z.infer<typeof shopValidation.offersStatusSchema>;
// type shopRank = z.infer<typeof shopValidation.shopRank>;
// type shopWithUser = Prisma.shopGetPayload<{
//     include: {
//         user: {
//             select: {
//                 username: true;
//                 email: true;
//                 fullname: true;
//             };
//         };
//     };
// }>;

// class shopService {
//     // private buildUserData(data: AddshopData) {
//     //     return {
//     //         username: data.username,
//     //         email: data.email,
//     //         fullname: data.fullname,
//     //         password: data.password,
//     //         phoneNumber: data.phoneNumber,
//     //         role: Role.SHOP,
//     //         isVerified: true,
//     //         secondaryPhoneNumber: data.secondaryPhoneNumber,
//     //     };
//     // }

//     private buildshopData(
//         data: AddshopData,
//         userId: string,
//         adminId: string,
//         image: string,
//         Rank: number,
//     ) {
//         return {
//             userId,
//             adminId: adminId,
//             amount: data.amount,
//             // shopCategoryId: data.shopCategoryId,
//             logo: image,
//             pincode: data.pincode,
//             contactPersonName: data.contactPersonName,
//             contactPersonNumber: data.contactPersonPhone,
//             contactPersonEmail: data.contactPersonEmail,
//             Rank: Rank + 1,
//             shopName: data.shopName,
//             // amount: data.amount,
//             tagLine: data.tagLine,
//             city: data.city,
//             state: data.state,
//             country: data.country,
//             startDate: data.startDate,
//             expiryDate: data.expiryDate,
//         };
//     }

//     private async handleshopNotFound(shop: shopWithUser | null) {
//         if (!shop) {
//             throw new ApiError(httpStatus.NOT_FOUND, 'shop not found');
//         }
//     }

//     private formatshop(shop: shopWithUser) {
//         const {user, ...shopData} = shop;
//         return {...shopData, ...user};
//     }

//     async registershop(adminId: string, data: AddshopData, image: string) {
//         const Admin = await prisma.admin.findUnique({
//             where: {
//                 id: adminId,
//             },
//             select: {
//                 shopCount: true,
//                 shop: {
//                     select: {
//                         Rank: true,
//                     },
//                     orderBy: {
//                         Rank: 'desc',
//                     },
//                     take: 1,
//                 },
//             },
//         });

//         if (!Admin) {
//             throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found');
//         }
//         if (Admin.shopCount === Admin.shop?.length) {
//             throw new ApiError(httpStatus.NOT_IMPLEMENTED, 'Shop Limit Reached');
//         }
//         const lastShop = Admin.shop?.[0];
//         const Rank = lastShop?.Rank ?? 0;
//         // const userData = this.buildUserData(data);

//         const newshop = await prisma.$transaction(async (tx) => {
//             const user = await userService.registerUser({
//                 username: data.phoneNumber,
//                 email: data.email,
//                 fullname: data.fullname,
//                 password: data.password,
//                 phoneNumber: data.phoneNumber,

//                 address: data.address,
//                 secondaryPhoneNumber: data.secondaryPhoneNumber,
//                 role: Role.SHOP,
//             });

//             if (!user) {
//                 throw new ApiError(httpStatus.NOT_FOUND, 'User not created');
//             }

//             const shopData = this.buildshopData(data, user.id, adminId, image, Rank);
//             const shop = await tx.shop.create({
//                 data: shopData,
//             });

//             if (!shop) {
//                 throw new ApiError(httpStatus.NOT_FOUND, 'shop not created');
//             }

//             if (data.shopCategoryId && data.shopCategoryId.length > 0) {
//                 await tx.shopCategories.createMany({
//                     data: data.shopCategoryId.map((categoryId) => ({
//                         shopId: shop.id,
//                         categoryId,
//                     })),
//                 });
//             }

//             await tx.user.update({
//                 where: {
//                     id: user.id,
//                 },
//                 data: {
//                     isVerified: true,
//                 },
//             });

//             return shop;
//         });

//         return newshop;
//     }

//     async getshops(adminId: string) {
//         const shops = await prisma.shop.findMany({
//             where: {
//                 adminId: adminId,
//             },
//             include: {
//                 shopCategories: {
//                     select: {
//                         category: {
//                             select: {
//                                 name: true,
//                             },
//                         },
//                     },
//                 },
//                 user: {
//                     select: {
//                         username: true,
//                         email: true,
//                         fullname: true,
//                         phoneNumber: true,
//                         secondaryPhoneNumber: true,
//                         isActive: true,
//                     },
//                 },
//                 _count: {
//                     select: {
//                         offers: true,
//                     },
//                 },
//             },
//             orderBy: {
//                 Rank: 'asc',
//             },
//         });
//         return shops;
//     }

//     async getshopById(id: string) {
//         const shop = await prisma.shop.findUnique({
//             where: {id},
//             include: {
//                 user: {
//                     select: {
//                         username: true,
//                         email: true,
//                         fullname: true,
//                         phoneNumber: true,
//                         secondaryPhoneNumber: true,
//                         address: true,
//                     },
//                 },
//                 shopCategories: {
//                     select: {
//                         category: {
//                             select: {
//                                 id: true,

//                                 name: true,
//                             },
//                         },
//                     },
//                 },
//             },
//         });

//         // this.handleshopNotFound(shop);
//         // return this.formatshop(shop!);
//         return shop;
//     }

//     async updateshop(id: string, data: UpdateshopData, image?: string) {
//         console.log('ser', data);
//         // 1️⃣ Find the shop
//         const shop = await prisma.shop.findUnique({
//             where: {id},
//             include: {user: true},
//         });

//         if (!shop) {
//             throw new ApiError(404, 'shop Not found');
//         }

//         // 2️⃣ Check if email or phone is used by someone else
//         // if (data.email) {
//         //     const emailExists = await prisma.user.findFirst({
//         //         where: {
//         //             email: data.email,
//         //             NOT: {id: shop.userId}, // ignore current user
//         //         },
//         //     });
//         //     if (emailExists) {
//         //         throw new ApiError(400, 'Email is already in use by another user');
//         //     }
//         // }

//         if (data.phoneNumber) {
//             const phoneExists = await prisma.user.findFirst({
//                 where: {
//                     phoneNumber: data.phoneNumber,
//                     NOT: {id: shop.userId},
//                 },
//             });
//             if (phoneExists) {
//                 throw new ApiError(400, 'This phone  is already in use by another user');
//             }
//         }
//         let password = shop.user.password;
//         if (data.password) {
//             const hashedPassword = await encryptPassword(data.password);
//             password = hashedPassword;
//         }
//         // 3️⃣ Update shop & related user
//         const updatedshop = await prisma.$transaction(async (tx) => {
//             await tx.user.update({
//                 where: {id: shop.userId},
//                 data: {
//                     fullname: data.fullname,
//                     email: data.email,
//                     phoneNumber: data.phoneNumber,
//                     secondaryPhoneNumber: data.secondaryPhoneNumber,
//                     password: password ?? undefined,
//                     address: data.address,
//                 },
//             });
//             await tx.shopCategories.deleteMany({
//                 where: {shopId: id},
//             });

//             if (data.shopCategoryId && data.shopCategoryId.length > 0) {
//                 await tx.shopCategories.createMany({
//                     data: data.shopCategoryId.map((categoryId) => ({
//                         shopId: id,
//                         categoryId,
//                     })),
//                 });
//             }

//             return tx.shop.update({
//                 where: {id},
//                 data: {
//                     amount: data.amount,
//                     // shopCategoryId: data.shopCategoryId,
//                     logo: image,
//                     description: data.description,
//                     pincode: data.pincode,
//                     contactPersonName: data.contactPersonName,
//                     contactPersonNumber: data.contactPersonPhone,
//                     contactPersonEmail: data.contactPersonEmail,
//                     tagLine: data.tagLine,
//                     // amount: data.amount,
//                     city: data.city,
//                     state: data.state,
//                     country: data.country,
//                     startDate: data.startDate,
//                     shopName: data.shopName,
//                     expiryDate: data.expiryDate,
//                 },
//                 include: {
//                     user: {
//                         select: {
//                             fullname: true,
//                             email: true,
//                             phoneNumber: true,
//                             secondaryPhoneNumber: true,
//                         },
//                     },
//                 },
//             });
//         });

//         return updatedshop;
//     }

//     async deleteshop(id: string) {
//         const shop = await prisma.shop.findUnique({
//             where: {id},
//             include: {user: true},
//         });
//         this.handleshopNotFound(shop);
//         await prisma.shopCategories.deleteMany({where: {shopId: id}});

//         await prisma.shop.delete({where: {id}});
//         await prisma.user.delete({
//             where: {id: shop!.userId},
//         });
//         return shop;
//     }
//     async getAllOffers(adminId: string) {
//         const offers = await prisma.offer.findMany({
//             where: {
//                 shop: {
//                     adminId: adminId,
//                 },
//                 // status: 'PENDING',
//             },
//             include: {
//                 shop: {
//                     include: {
//                         shopCategories: {
//                             select: {
//                                 category: {
//                                     select: {
//                                         name: true,
//                                     },
//                                 },
//                             },
//                         },
//                         user: {
//                             select: {
//                                 email: true,
//                                 fullname: true,
//                             },
//                         },
//                     },
//                 },
//             },
//             orderBy: {
//                 createdAt: 'desc',
//             },
//         });
//         // console.log(offers);
//         return offers;
//     }
//     async updateOfferStatus(offerId: string, data: OffersStatusData) {
//         const offer = await prisma.offer.update({
//             where: {id: offerId},
//             data: {status: data.status, reason: data.reason},
//         });
//         return offer;
//     }
//     async deActiveShop(id: string) {
//         const shop = await prisma.shop.findUnique({
//             where: {
//                 id,
//             },
//             include: {
//                 user: true,
//             },
//         });
//         if (!shop) {
//             throw new ApiError(400, 'Shop not Found');
//         }
//         await prisma.user.update({
//             where: {
//                 id: shop.userId,
//             },
//             data: {
//                 isActive: shop.user.isActive === true ? false : true,
//             },
//         });
//     }
//     async updateShopRanking(data: shopRank) {
//         return await prisma.$transaction(
//             data.map((item) =>
//                 prisma.shop.update({
//                     where: {
//                         id: item.shopId,
//                     },
//                     data: {
//                         Rank: item.rank,
//                     },
//                 }),
//             ),
//         );
//     }
// }

// export default new shopService();

import {z} from 'zod';
import prisma from '@client';
import {sizeValidation} from '@validations/index';
import ApiError from '@utils/ApiError';
import httpStatus from 'http-status';
export type CreateSizeInput = z.infer<typeof sizeValidation.sizeSchema>;
export type UpdateSizeInput = z.infer<typeof sizeValidation.updateSizeSchema>;

class SizeService {
    async create(adminId: string, data: CreateSizeInput) {
        const trimmedSize = data.size.trim();
        const existing = await prisma.size.findFirst({
            where: {
                adminId,
                size: {
                    equals: trimmedSize,
                    mode: 'insensitive',
                },
            },
        });
        if (existing) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Size already exists');
        }

        return await prisma.size.create({
            data: {
                size: trimmedSize,
                adminId,
            },
        });
    }

    async getAll(adminId: string) {
        return await prisma.size.findMany({
            where: {
                adminId: adminId,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async getById(id: string) {
        return await prisma.size.findUnique({
            where: {id},
        });
    }

    async update(id: string, data: UpdateSizeInput) {
        const existingSize = await prisma.size.findUnique({
            where: {id},
        });
        if (!existingSize) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Size not found');
        }

        const trimmedSize = data.size?.trim();
        if (trimmedSize && trimmedSize.toLowerCase() !== existingSize.size.toLowerCase()) {
            const existing = await prisma.size.findFirst({
                where: {
                    adminId: existingSize.adminId,
                    size: {
                        equals: trimmedSize,
                        mode: 'insensitive',
                    },
                    id: {
                        not: id,
                    },
                },
            });
            if (existing) {
                throw new ApiError(httpStatus.BAD_REQUEST, 'Size already exists');
            }
        }

        return await prisma.size.update({
            where: {id},
            data: {
                ...data,
                size: trimmedSize || data.size,
            },
        });
    }

    async remove(id: string) {
        const size = await prisma.size.findUnique({where: {id}});
        if (!size) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Size not found');
        }
        return await prisma.size.delete({
            where: {id},
        });
    }
}

export default new SizeService();
