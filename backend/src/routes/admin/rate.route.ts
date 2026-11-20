import {Router} from 'express';
import {rateController} from '@controllers/admin/index';

const rateRouter = Router();

rateRouter.get('/', rateController.getRates);

// Melting
rateRouter.post('/melting', rateController.createMeltingRate);
rateRouter.put('/melting', rateController.updateMeltingRate);

// Company
rateRouter.post('/company', rateController.createCompanyRate);
rateRouter.put('/company', rateController.updateCompanyRate);

// Press
rateRouter.post('/press', rateController.createPressRate);
rateRouter.put('/press', rateController.updatePressRate);

// Sutt
rateRouter.post('/sutt', rateController.createSuttRate);
rateRouter.put('/sutt', rateController.updateSuttRate);

// Bharnai
rateRouter.post('/bharnai', rateController.createBharnaiRate);
rateRouter.put('/bharnai', rateController.updateBharnaiRate);

// Cutting
rateRouter.post('/cutting', rateController.createCuttingRate);
rateRouter.put('/cutting', rateController.updateCuttingRate);

// Wash
rateRouter.post('/wash', rateController.createWashRate);
rateRouter.put('/wash', rateController.updateWashRate);

// Polishing
rateRouter.post('/polishing', rateController.createPolishingRate);
rateRouter.put('/polishing', rateController.updatePolishingRate);

// Vibrator
rateRouter.post('/vibrator', rateController.createVibratorRate);
rateRouter.put('/vibrator', rateController.updateVibratorRate);

// Meena
rateRouter.post('/meena', rateController.createMeenaRate);
rateRouter.put('/meena', rateController.updateMeenaRate);

// Tass
rateRouter.post('/tass', rateController.createTassRate);
rateRouter.put('/tass', rateController.updateTassRate);

// Generic per-process routes (used by the Karigar master "common rate"); keep these last
rateRouter.get('/:process', rateController.getProcessRate);
rateRouter.post('/:process', rateController.setProcessRate);
rateRouter.put('/:process', rateController.setProcessRate);

export default rateRouter;
