import {Router} from 'express';
import {stockController} from '@controllers/admin/index';

const stockRoutes = Router();

stockRoutes.route('/').get(stockController.getAllStocks).post(stockController.createStock);
stockRoutes.route('/history/:id').get(stockController.getStockHistory);
stockRoutes.route('/increment/:id').post(stockController.incrementStock);
stockRoutes.route('/loss').get(stockController.getLossReport);
stockRoutes.route('/current').get(stockController.getMyCurrentStock);

stockRoutes.route('/report').post(stockController.getStockInventoryReport);

stockRoutes.route('/today').get(stockController.getTodayReport);

stockRoutes
    .route('/:id')
    .get(stockController.getStockById)
    .put(stockController.updateStock)
    .delete(stockController.deleteStock);

export default stockRoutes;
