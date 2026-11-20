import {Router} from 'express';
import {sizeController} from '@controllers/admin/index';
// import {upload} from '@middlewares/index';

const sizeRoutes = Router();

sizeRoutes.route('/').get(sizeController.getAllSizes).post(sizeController.createSize);
sizeRoutes
    .route('/:id')
    .get(sizeController.getSizeById)
    .put(sizeController.updateSize)
    .delete(sizeController.deleteSize);

export default sizeRoutes;
