import {manufacturingController} from '@controllers/admin/index';
import {checkAdmin, verifyJWT} from '@middlewares/index';
import {Router} from 'express';

import karigarRoutes from './karigar.routes';
import designRoutes from './design.routes';
import rateRouter from './rate.route';
import sizeRoutes from './size.routes';
import stockRoutes from './stock.routes';
import itemRoutes from './item.routes';
import clientRoutes from './client.routes';
import profileRoutes from './profile.routes';
import manufacturingRoutes from './manufacturing.routes';
import billingRoutes from './billing.routes';

const router = Router();

router.use(verifyJWT, checkAdmin);

router.use('/karigar', karigarRoutes);
router.use('/design', designRoutes);
router.use('/rates', rateRouter);

router.use('/item', itemRoutes);

router.use('/size', sizeRoutes);
router.use('/stock', stockRoutes);
router.use('/client', clientRoutes);
router.use('/profile', profileRoutes);
router.use('/manufacturing', manufacturingRoutes);
router.use('/billing', billingRoutes);
router.get('/scrap', manufacturingController.listScrap);

export default router;
