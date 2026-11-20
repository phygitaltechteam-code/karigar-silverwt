import {Router} from 'express';
import {adminController} from '@controllers/superAdmin/index';

const router = Router();

router.route('/').get(adminController.getAllAdmins).post(adminController.createAdmin);

router
    .route('/:id')
    .get(adminController.getAdminById)
    .put(adminController.updateAdmin)
    .delete(adminController.deleteAdmin);

export default router;
