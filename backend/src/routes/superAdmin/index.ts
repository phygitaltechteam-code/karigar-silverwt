import {Router} from 'express';
import {checkSuperAdmin, verifyJWT} from '@middlewares/index';
import adminRoutes from './admin.routes';

const router = Router();

// Every /superAdmin route requires a logged-in SUPERADMIN
router.use(verifyJWT, checkSuperAdmin);

router.use('/admin', adminRoutes);

export default router;
