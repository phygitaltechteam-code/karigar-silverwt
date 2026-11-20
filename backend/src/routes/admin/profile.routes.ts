import {Router} from 'express';
import {profileController} from '@controllers/admin/index';
import {STAGE_ALERT_PROCESSES} from '@services/admin/profile.service';
// import {billingLimiter} from '@middlewares/index';
// import {upload} from '@middlewares/index';

const profileRoutes = Router();

profileRoutes
    .route('/')
    .get(profileController.getProfile)
    .put(profileController.updateProfile)
    .post(profileController.updatePdfHeader);

profileRoutes.route('/pdf').get(profileController.getPdfId);
profileRoutes.route('/expiry').post(profileController.expandExpiry);
profileRoutes.route('/check-password').post(profileController.checkPassword);
profileRoutes
    .route('/password')
    .post(profileController.checkPassword)
    .put(profileController.changePassword);
profileRoutes
    .route('/change-password')
    .post(profileController.changePassword)
    .put(profileController.changePassword);

const alertProcesses = [
    'tar',
    'melting',
    'box',
    'kunda',
    'joint',
    'cutting',
    'soldering',
    'galai',
    ...STAGE_ALERT_PROCESSES,
] as const;

alertProcesses.forEach((proc) => {
    profileRoutes
        .route(`/${proc}`)
        .get(profileController.getAlerts(proc))
        .post(profileController.upsertAlerts(proc));

    profileRoutes.route(`/${proc}/:id`).delete(profileController.deleteAlert(proc));
});

export default profileRoutes;
