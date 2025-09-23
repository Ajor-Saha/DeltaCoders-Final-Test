import { Router } from 'express';
import { CreateExternalResources } from '../controllers/resources-controllers';
import { verifyJWT } from '../middleware/auth-middleware';

const resource_router = Router();

resource_router.use(verifyJWT);

//below are all protected routes

resource_router.route('/create-resources').post(CreateExternalResources);

export default resource_router;
