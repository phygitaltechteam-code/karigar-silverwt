import {Router} from 'express';
import {clientController} from '@controllers/admin/index';

const clientRoutes = Router();

clientRoutes.route('/').get(clientController.getAllClients).post(clientController.createClient);

clientRoutes.route('/pay/:id').post(clientController.payDue).get(clientController.clientHistory);

clientRoutes
    .route('/:id')
    .get(clientController.getClientById)
    .put(clientController.updateClient)
    .delete(clientController.deleteClient);

export default clientRoutes;
