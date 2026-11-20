import prisma from '@client';
import {ApiError} from '@utils/index';
import designValidation from '@validations/design.validation';
import httpStatus from 'http-status';
import {z} from 'zod';
import {manufacturingProcess} from '@prisma/client';

type CreateDesignInput = z.infer<typeof designValidation.createSchema>;
type UpdateDesignInput = z.infer<typeof designValidation.updateSchema>;

class designService {
    // async createDesign(adminId: string, data: CreateDesignInput) {
    //     const design = await prisma.design.findUnique({
    //         where: {name_adminId: {name: data.name, adminId}},
    //     });
    //     if (!design) {
    //         throw new ApiError(httpStatus.NOT_FOUND, 'Design not found');
    //     }

    //     const newDesign = await prisma.design.create({
    //         data: {
    //             name: data.name,
    //             process: data.process,
    //             rate: data.rate || null,
    //             adminId: adminId,
    //         },
    //     });
    //     return newDesign;
    // }

    // async updateDesign(id: string, data: UpdateDesignInput) {
    //     const design = await prisma.design.findUnique({
    //         where: {id},
    //     });
    //     if (!design) {
    //         throw new ApiError(httpStatus.NOT_FOUND, 'Design not found');
    //     }
    //     const updatedDesign = await prisma.design.update({
    //         where: {id},
    //         data: {
    //             name: data.name,
    //             process: data.process,
    //             rate: data.rate || null,
    //         },
    //     });
    //     return updatedDesign;
    // }

    // Create design
    async createDesign(adminId: string, data: CreateDesignInput) {
        const existingDesign = await prisma.design.findUnique({
            where: {
                name_adminId: {
                    name: data.name,
                    adminId,
                },
            },
        });

        if (existingDesign) {
            throw new ApiError(httpStatus.CONFLICT, 'Design with this name already exists');
        }

        // Only SOLDERING can have a rate
        if (data.process !== manufacturingProcess.SOLDERING && data.rate !== undefined) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                'Rate can only be added for the SOLDERING process',
            );
        }

        const newDesign = await prisma.design.create({
            data: {
                name: data.name,
                process: data.process,
                rate: data.process === manufacturingProcess.SOLDERING ? (data.rate ?? null) : null,
                adminId,
            },
        });

        return newDesign;
    }

    // Update design
    async updateDesign(adminId: string, id: string, data: UpdateDesignInput) {
        const design = await this.getById(adminId, id);

        if (data.name && data.name !== design.name) {
            const duplicate = await prisma.design.findUnique({
                where: {name_adminId: {name: data.name, adminId}},
            });
            if (duplicate) {
                throw new ApiError(httpStatus.CONFLICT, 'Design with this name already exists');
            }
        }

        // Determine the final process after applying the update
        const finalProcess = data.process ?? design.process;

        if (finalProcess !== manufacturingProcess.SOLDERING && data.rate !== undefined) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                'Rate can only be added for the SOLDERING process',
            );
        }

        const updatedDesign = await prisma.design.update({
            where: {id},
            data: {
                name: data.name,
                process: data.process,
                // Keep the existing rate unless a new one is sent; clear it if no longer SOLDERING
                rate: finalProcess === manufacturingProcess.SOLDERING ? data.rate : null,
            },
        });

        return updatedDesign;
    }

    async getAll(adminId: string, process?: manufacturingProcess) {
        return await prisma.design.findMany({
            where: {adminId, ...(process ? {process} : {})},
            orderBy: {createdAt: 'desc'},
        });
    }

    async getById(adminId: string, id: string) {
        const design = await prisma.design.findFirst({
            where: {id, adminId},
        });
        if (!design) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Design not found');
        }
        return design;
    }

    async deleteDesign(adminId: string, id: string) {
        const design = await this.getById(adminId, id);
        return await prisma.design.delete({
            where: {id: design.id},
        });
    }
}

export default new designService();
