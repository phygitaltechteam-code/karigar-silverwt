import {Router} from 'express';
import {designController} from '@controllers/admin/index';

const designRouter = Router();

designRouter.route('/').get(designController.getAll).post(designController.create);

designRouter
    .route('/:id')
    .get(designController.getById)
    .put(designController.update)
    .delete(designController.remove);

export default designRouter;
