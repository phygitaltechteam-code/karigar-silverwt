import {Router} from 'express';
import {billingController as c} from '@controllers/admin/index';

const router = Router();

router.put('/check', c.checkStock);
router.route('/').get(c.getAll).post(c.create);
router.route('/:id').get(c.getById).put(c.update).delete(c.remove);

export default router;
