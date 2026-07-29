import { Router } from 'express';
import { getCatalogos } from './catalogoController.js';

const router = Router();

router.get('/', getCatalogos);

export default router;
