import {File} from 'multer';

declare global {
    namespace Express {
        interface Request {
            user: {
                id: string;
                username?: string | null;
                email?: string | null;
                fullname: string;
                role: Role;
                phoneNumber: string;
                adminId?: string;
                employeeId?: string;
                // languageId?: string;
            };
            file?: File;
            files?:
                | {
                      [fieldname: string]: Express.Multer.File[];
                  }
                | Express.Multer.File[];
        }
    }
}
