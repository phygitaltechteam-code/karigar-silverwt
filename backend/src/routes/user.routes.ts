import {Router} from 'express';
import {userController} from '@controllers/index';
import {upload, verifyJWT} from '@middlewares/index';

const {
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
} = userController;

const router = Router();

// Public routes
router.route('/register').post(
    upload.fields([
        {name: 'logo', maxCount: 1},
        {name: 'coverImage', maxCount: 1},
    ]),
    registerUser,
);
// router.route('/self-register').post(
//     upload.fields([
//         {name: 'logo', maxCount: 1},
//         {name: 'coverImage', maxCount: 1},
//     ]),
//     selfRegisterAdmin,
// );
router.route('/verify-code').post(verifyVerificationCode);
router.route('/login').post(loginUser);
router.route('/reset-password-request').post(requestPasswordReset);
router.route('/refresh').post(refreshAccessToken);
// router.route('/user-info').post(getUserInfo);
// Private routes
router.use(verifyJWT);

router.route('/logout').post(logoutUser);
router.route('/reset-password').post(resetPassword);
router.route('/change-password').post(changeCurrentPassword);
router.route('/me').get(getCurrentUser);

router.route('/update').patch(updateUser);

export default router;
