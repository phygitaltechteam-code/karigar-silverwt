import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import httpStatus from 'http-status';
import cookieParser from 'cookie-parser';

import {config, morgan, swaggerRouter} from '@config/index';
import {
    // xss,
    authLimiter,
    notFoundHandler,
    errorConverter,
    errorHandler,
} from '@middlewares/index';
import routes from '@routes/index';
import {ApiResponse} from '@utils/index';

// Create Express app
const app = express();
// Middleware setup
app.use(helmet()); // Set security HTTP headers
app.use(express.json({limit: '16mb'})); // Parse JSON request body with size limit
app.use(express.urlencoded({extended: true, limit: '16mb'})); // Parse URL-encoded request body with size limit
app.use(express.static('public')); // Serve static files
app.use(cookieParser()); // Parse cookies
// TODO
// app.use(xss()); // Sanitize request data
app.use(compression()); // Apply gzip compression

// CORS configuration
app.use(
    cors({
        origin: '*',
        credentials: true,
    }),
);
app.set('trust proxy', true); // Required to get real IP from x-forwarded-for
// Logging middleware
if (config.env !== 'test') {
    app.use(morgan.successHandler);
    app.use(morgan.errorHandler);
}

// Rate limiting
if (config.env === 'production') {
    app.use('/v1/auth', authLimiter);
}

// Routes
app.use('/api/v1', routes); // API routes
app.use(swaggerRouter); // Swagger documentation routes
app.get('/', (req, res) => {
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, undefined, 'Welcome to node api'),
    );
});

// Error handling
app.use(notFoundHandler);
app.use(errorConverter); // Convert errors to ApiError
app.use(errorHandler); // Handle errors

export default app;
