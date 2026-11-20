import httpStatus from 'http-status';
import {userService} from '@services/index';
import {catchAsync, ApiResponse} from '@utils/index';
import {userValidation} from '@validations/index';
import {uploadFileToHostedServer} from '@utils/s3upload';

const registerUser = catchAsync(async (req, res) => {
    const userData = userValidation.registerUserSchema.parse(req.body);
    const files = req.files as {
        logo?: Express.Multer.File[];
        coverImage?: Express.Multer.File[];
    };

    let logoUrl = '';
    let coverImageUrl = '';

    if (files?.logo?.length) {
        const result = await uploadFileToHostedServer(files.logo[0].path);
        logoUrl = result?.link || '';
    }

    // COVER IMAGE
    if (files?.coverImage?.length) {
        const result = await uploadFileToHostedServer(files.coverImage[0].path);
        coverImageUrl = result?.link || '';
    }

    const createdUser = await userService.registerUser(userData, logoUrl, coverImageUrl);

    // const emailResponse = await emailService.sendVerificationEmail(
    //     createdUser.email,
    //     createdUser.username,
    //     createdUser.verifyCode!,
    //     redirect as string,
    // );

    // if (!emailResponse.success) {
    //     throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, emailResponse.message);
    // }

    return res
        .status(httpStatus.CREATED)
        .json(new ApiResponse(httpStatus.CREATED, createdUser, 'User created successfully...!'));
});

const loginUser = catchAsync(async (req, res) => {
    const {email, username, password} = userValidation.loginUserSchema.parse(req.body);
    const data = await userService.loginUser({email, username, password});
    const {accessToken, refreshToken, user} = data;

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(httpStatus.OK)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json(
            new ApiResponse(
                httpStatus.OK,
                {accessToken, refreshToken, user},
                'User logged in successfully',
            ),
        );
});

const logoutUser = catchAsync(async (req, res) => {
    await userService.logoutUser(req.user!.id);

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(httpStatus.OK)
        .clearCookie('accessToken', options)
        .clearCookie('refreshToken', options)
        .json(new ApiResponse(httpStatus.OK, {}, 'User logged out successfully'));
});

const refreshAccessToken = catchAsync(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    const {accessToken, refreshToken} = await userService.refreshAccessToken(incomingRefreshToken);

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(httpStatus.OK)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json(
            new ApiResponse(
                httpStatus.OK,
                {accessToken, refreshToken},
                'Token refreshed successfully',
            ),
        );
});

const getCurrentUser = catchAsync(async (req, res) => {
    return res
        .status(httpStatus.OK)
        .json(new ApiResponse(httpStatus.OK, req.user, 'User fetched successfully'));
});

const changeCurrentPassword = catchAsync(async (req, res) => {
    const {currentPassword, newPassword} = userValidation.changePasswordSchema.parse(req.body);
    await userService.changeCurrentPassword(req.user!.id, {currentPassword, newPassword});

    return res
        .status(httpStatus.OK)
        .json(new ApiResponse(httpStatus.OK, {}, 'Password changed successfully'));
});

const updateUser = catchAsync(async (req, res) => {
    const data = userValidation.updateUserSchema.parse(req.body);
    const user = await userService.updateUser(req.user!.id, data);

    return res
        .status(httpStatus.OK)
        .json(new ApiResponse(httpStatus.OK, user, 'User updated successfully'));
});

const verifyVerificationCode = catchAsync(async (req, res) => {
    const data = userValidation.verifyVerificationCodeSchema.parse(req.body);
    await userService.verifyVerificationCode(data);

    return res
        .status(httpStatus.OK)
        .json(new ApiResponse(httpStatus.OK, undefined, 'Account verified successfully!'));
});

const requestPasswordReset = catchAsync(async (req, res) => {
    const {email} = userValidation.requestPasswordResetSchema.parse(req.body);
    await userService.requestPasswordReset(email);

    return res
        .status(httpStatus.CREATED)
        .json(
            new ApiResponse(
                httpStatus.CREATED,
                undefined,
                `Password reset email sent.... Please check your email!`,
            ),
        );
});

const resetPassword = catchAsync(async (req, res) => {
    const {newPassword} = userValidation.resetPasswordSchema.parse(req.body);
    await userService.resetPassword(req.user!.id, newPassword);

    return res
        .status(httpStatus.OK)
        .json(new ApiResponse(httpStatus.OK, {}, 'Password reset successfully'));
});

// const selfRegisterAdmin = catchAsync(async (req, res) => {
//     const userData = userValidation.selfRegisterAdminSchema.parse(req.body);
//     const files = req.files as {
//         logo?: Express.Multer.File[];
//         coverImage?: Express.Multer.File[];
//     };

//     let logoUrl = '';
//     let coverImageUrl = '';

//     if (files?.logo?.length) {
//         const result = await uploadFileToHostedServer(files.logo[0].path);
//         logoUrl = result?.link || '';
//     }

//     if (files?.coverImage?.length) {
//         const result = await uploadFileToHostedServer(files.coverImage[0].path);
//         coverImageUrl = result?.link || '';
//     }

//     const now = new Date();
//     const expiryDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

//     const fullUserData = {
//         ...userData,
//         role: 'ADMIN' as const,
//         startDate: now,
//         expiryDate: expiryDate,
//     };

//     const createdUser = await userService.registerUser(fullUserData, logoUrl, coverImageUrl);

//     return res
//         .status(httpStatus.CREATED)
//         .json(
//             new ApiResponse(
//                 httpStatus.CREATED,
//                 createdUser,
//                 'Admin registered successfully! Expiry set to 7 days from now.',
//             ),
//         );
// });

// const getUserInfo = catchAsync(async (req, res) => {
//     const {key} = userValidation.useLicenseKeySchema.parse(req.body);
//     const result = await userService.getUserInfo(key);
//     return res
//         .status(httpStatus.OK)
//         .json(
//             new ApiResponse(
//                 httpStatus.OK,
//                 result,
//                 'User details fetched and key matched successfully.',
//             ),
//         );
// });

export default {
    registerUser,
    // selfRegisterAdmin,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    changeCurrentPassword,
    updateUser,
    verifyVerificationCode,
    requestPasswordReset,
    resetPassword,
    // getUserInfo,
};
