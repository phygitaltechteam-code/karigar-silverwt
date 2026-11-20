import {Router} from 'express';
import userRoute from './user.routes';
import adminRoute from './admin/index';
import superAdminRoute from './superAdmin/index';

const router = Router();

router.use('/users', userRoute);
router.use('/admin', adminRoute);
router.use('/superAdmin', superAdminRoute);

export default router;
