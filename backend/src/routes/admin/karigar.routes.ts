// import {Router} from 'express';
// import {karigarController} from '@controllers/admin/index';
// import {karigarValidation} from '@validations/index';
// import {karigarService} from '@services/admin/index';
// import validateRequest from '@middlewares/validateRequest';
// import authMiddleware from '@middlewares/auth.middleware';
// import { createSchema, idSchema, updateSchema } from '@validations/karigar.validation';

// const router = Router();

// router.use(authMiddleware);

// router.post('/', validateRequest(createSchema), karigarController.createKarigar);

// router.get('/', karigarController.getAllKarigars);

// router.get('/single/:id', validateRequest(idSchema), karigarController.getSingleKarigar);

// router.put(
//     '/:id',
//     validateRequest(idSchema),
//     validateRequest(updateSchema),
//     karigarController.updateKarigar,
// );

// router.delete('/:id', validateRequest(idSchema), karigarController.deleteKarigar);

// export default router;

import {Router} from 'express';
import {karigarController} from '@controllers/admin/index';

const karigarRouter = Router();

karigarRouter
    .route('/')
    .get(karigarController.getAllKarigars)
    .post(karigarController.createKarigar);

karigarRouter.route('/single/:id').get(karigarController.getSingleKarigar);

karigarRouter
    .route('/:id/payments')
    .get(karigarController.listPayments)
    .post(karigarController.addPayment);

karigarRouter
    .route('/:id')
    .get(karigarController.getSingleKarigar)
    .put(karigarController.updateKarigar)
    .delete(karigarController.deleteKarigar);

export default karigarRouter;
