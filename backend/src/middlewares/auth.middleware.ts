import {Request, Response, NextFunction} from 'express';
import {catchAsync, ApiError} from '@utils/index';
import prisma from '../client';
import {tokenService} from '@services/index';
import httpStatus from 'http-status';
import {Role, User} from '@prisma/client';
import {commonValidation} from '@validations/index';

type SelectedUser = Pick<
    User,
    'id' | 'username' | 'email' | 'fullname' | 'phoneNumber' | 'secondaryPhoneNumber' | 'role'
>;
const getTokenFromRequest = (req: Request): string => {
    const token =
        req.cookies?.accessToken || req.headers.authorization?.replace('Bearer ', '') || '';
    // console.log(token);
    commonValidation.tokenSchema.parse(token);

    return token;
};

const assignRoleData = async (user: SelectedUser, req: Request) => {
    if (user.role === Role.ADMIN) {
        const admin = await prisma.admin.findUnique({
            where: {userId: user.id},
            select: {id: true},
        });
        if (!admin) throw new ApiError(httpStatus.UNAUTHORIZED, 'Admin not found');
        req.user = {...user, adminId: admin.id};
    } else {
        req.user = {...user};
    }
};

const verifyJWT = catchAsync(async (req, res, next) => {
    const token = getTokenFromRequest(req);
    const decodedToken = tokenService.verifyToken(token);

    const user = await prisma.user.findUnique({
        where: {id: decodedToken.id},
        select: {
            id: true,
            username: true,
            email: true,
            fullname: true,
            role: true,
            phoneNumber: true,
            secondaryPhoneNumber: true,
        },
    });

    if (!user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
    }

    await assignRoleData(user, req);
    next();
});

const checkRole = (requiredRoles: Role | Role[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = req.user;

        if (!user) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
        }

        const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

        if (!roles.includes(user.role)) {
            throw new ApiError(
                httpStatus.FORBIDDEN,
                `Access denied: Your role (${user.role}) does not have permission. Required role(s): ${roles.join(', ')}.`,
            );
        }

        next();
    };
};

const checkAdmin = checkRole(Role.ADMIN);
const checkSuperAdmin = checkRole(Role.SUPERADMIN);
// const checkSuperAdmin = checkRole(Role.SUPERADMIN);
// const checkClient = checkRole(Role.CLIENT);
// const checkMaharaj = checkRole(Role.MAHARAJ);
// const checkStaff = checkRole(Role.STAFF);
// const checkVendor = checkRole(Role.VENDOR);

// const checkCaterorOrStaff = checkRole([Role.ADMIN, Role.SHOP]);

export {
    verifyJWT,
    checkRole,
    checkAdmin,
    checkSuperAdmin,
    // checkEmployee,
    // checkSuperAdmin,
    // checkClient,
    // checkMaharaj,
    // checkStaff,
    // checkVendor,
    // checkCaterorOrStaff,
};
