/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Calculate the predicted value of a given x using simple linear regression.
 *
 * @param X - array of independent variable data
 * @param Y - array of dependent variable data
 * @param x - value of independent variable to predict
 * @returns predicted value of dependent variable
 */
const simpleLinearRegression = (X: number[], Y: number[], x: number): number => {
    let greterindex = -1;
    let lessindex = -1;

    for (let i = 0; i < X.length; i++) {
        if (X[i] > x) {
            greterindex = i;
            break;
        }
    }

    for (let i = X.length - 1; i >= 0; i--) {
        if (X[i] < x) {
            lessindex = i;
            break;
        }
    }

    if (greterindex === -1) {
        greterindex = lessindex + 1;
        if (lessindex === X.length - 1) {
            lessindex = X.length - 2;
            greterindex = X.length - 1;
        }
    }
    if (lessindex === -1) {
        lessindex = greterindex - 1;
        if (greterindex === 0) {
            greterindex = 1;
            lessindex = 0;
        }
    }

    const ydiff = Y[greterindex] - Y[lessindex];

    const xdiff = X[greterindex] - X[lessindex];
    const m = ydiff / xdiff;
    const mx1 = m * X[greterindex];
    const c = Y[greterindex] - mx1;

    // if (n !== Y.length || n === 0) {
    //     return 0;
    // }

    // // Calculate means
    // const meanX = X.reduce((acc, val) => acc + val, 0) / n;
    // const meanY = Y.reduce((acc, val) => acc + val, 0) / n;

    // let covariance = 0;
    // let variance = 0;

    // for (let i = 0; i < n; i++) {
    //     covariance += (X[i] - meanX) * (Y[i] - meanY);
    //     variance += (X[i] - meanX) ** 2;
    // }

    // if (variance === 0) {
    //     return 0;
    // }

    // const beta1 = covariance / variance;
    // const beta0 = meanY - beta1 * meanX;
    return m * x + c;
};

export interface WorkingDurationResult {
    hours: number;
    minutes: number;
    totalMinutes: number;
    totalHours: number;
    timeTaken: string;
}

/**
 * Calculates working hours and minutes elapsed between two timestamps
 * taking into account an Admin's daily working hours (workStartTime to workEndTime).
 */
const calculateWorkingDuration = (
    startDate: Date | string | null | undefined,
    endDate: Date | string | null | undefined,
    workStartTime?: Date | string | null,
    workEndTime?: Date | string | null,
): WorkingDurationResult => {
    const zeroResult: WorkingDurationResult = {
        hours: 0,
        minutes: 0,
        totalMinutes: 0,
        totalHours: 0,
        timeTaken: '0h 0m',
    };

    if (!startDate || !endDate) return zeroResult;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end.getTime() <= start.getTime()) {
        return zeroResult;
    }

    let totalMs = 0;

    if (workStartTime && workEndTime) {
        const wStart = new Date(workStartTime);
        const wEnd = new Date(workEndTime);

        if (!isNaN(wStart.getTime()) && !isNaN(wEnd.getTime())) {
            const startHour = wStart.getHours();
            const startMin = wStart.getMinutes();
            const endHour = wEnd.getHours();
            const endMin = wEnd.getMinutes();

            const startMinutesOfDay = startHour * 60 + startMin;
            const endMinutesOfDay = endHour * 60 + endMin;

            if (endMinutesOfDay > startMinutesOfDay) {
                const current = new Date(start);
                current.setHours(0, 0, 0, 0);

                const lastDay = new Date(end);
                lastDay.setHours(0, 0, 0, 0);

                while (current.getTime() <= lastDay.getTime()) {
                    const dayWorkStart = new Date(current);
                    dayWorkStart.setHours(startHour, startMin, 0, 0);

                    const dayWorkEnd = new Date(current);
                    dayWorkEnd.setHours(endHour, endMin, 0, 0);

                    const effectiveStart = Math.max(start.getTime(), dayWorkStart.getTime());
                    const effectiveEnd = Math.min(end.getTime(), dayWorkEnd.getTime());

                    if (effectiveEnd > effectiveStart) {
                        totalMs += effectiveEnd - effectiveStart;
                    }

                    current.setDate(current.getDate() + 1);
                }
            } else {
                totalMs = end.getTime() - start.getTime();
            }
        } else {
            totalMs = end.getTime() - start.getTime();
        }
    } else {
        totalMs = end.getTime() - start.getTime();
    }

    const totalMinutes = Math.floor(totalMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const totalHours = Number((totalMinutes / 60).toFixed(2));
    const timeTaken = `${hours}h ${minutes}m`;

    return {
        hours,
        minutes,
        totalMinutes,
        totalHours,
        timeTaken,
    };
};

/**
 * Rounds a numeric or Decimal value to 3 decimal places.
 * Preserves null and undefined values.
 */
const round3 = (val: any): any => {
    if (val === null || val === undefined) return val;
    return Number(Number(val).toFixed(3));
};

export {simpleLinearRegression, calculateWorkingDuration, round3};

/** The fine-metal item: no size, purity treated as 100% (fine silver) */
export const FINE_ITEM_NAME = 'SILVER';
