import {Router} from 'express';
import {manufacturingController as c} from '@controllers/admin/index';

const router = Router();

// Shared
router.get('/stock/available', c.getAvailableStock);
router.post('/dispatch', c.dispatch);
router.post('/finished-to-stock', c.finishedToStock);
router.post('/loose-to-packaging', c.looseToPackaging);
router.post('/pack-loose', c.packLoose);

// Galai takes raw silver from Stock
router.post('/galai/receive', c.galaiReceive);

// Per stage: /admin/manufacturing/:process/...
router.get('/:process/entries', c.listEntries);
router.get('/:process/history', c.history);
router.get('/:process/cards', c.listCards);
router.put('/:process/entries/:id', c.updateEntry);
router.post('/:process/entries/:id/complete', c.completeEntry);
router.delete('/:process/entries/:id', c.revertEntry);

export default router;
