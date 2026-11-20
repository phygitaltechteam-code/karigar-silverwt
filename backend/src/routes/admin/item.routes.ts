import {Router} from 'express';
import {itemController} from '@controllers/admin/index';
// import {upload} from '@middlewares/index';

const itemRoutes = Router();

itemRoutes.route('/').get(itemController.getAllItems).post(itemController.createItem);
itemRoutes
    .route('/:id')
    .get(itemController.getItemById)
    .put(itemController.updateItem)
    .delete(itemController.deleteItem);

export default itemRoutes;
