"use server";
import { neon, NeonDbError } from "@neondatabase/serverless";
import { v4 as getID } from "uuid";
import { FormValues } from "./register/page";
import QRCode from "qrcode";

export async function createSession(values: FormValues) {
    const psql = neon(process.env.DATABASE_URL || "");

    let result;
    try {
        result = await psql`
    SELECT id
    FROM users 
    WHERE email = ${values.email} 
    LIMIT 1
    `;
    } catch {
        return "ERROR : Failed to fetch data from database.";
    }

    let userId: string;

    if (result.length == 0) {
        try {
            userId = getID();
            await psql`
            INSERT INTO users (id, fullname, email, instansi, age) 
            VALUES (${userId}, ${values.fullname}, ${values.email}, ${values.instansi}, ${values.age});
            `;
        } catch {
            return "ERROR : Failed to register user.";
        }
    } else {
        userId = result[0].id;
    }

    let sessionResult;
    try {
        sessionResult = await psql`
    SELECT 1 
    FROM users_sessions 
    WHERE user_id = ${userId} AND session = ${values.session} 
    LIMIT 1
    `;
    } catch { return "ERROR : Failed to fetch session from database"; }

    if (sessionResult.length == 0) {
        try {
            await psql`
            INSERT INTO users_sessions (user_id, session) 
            VALUES (${userId}, ${values.session});
            `;
        } catch (error) {
            return "ERROR : Failed to register new session."
        }
    } else {
        return "ERROR : You are already registered in this session."
    }

    const qrData = {
        'id': userId,
        'session': values.session
    };

    const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));

    return qrCode;
}

export async function displaySession(email: String, session: String) {
    const psql = neon(process.env.DATABASE_URL || "");

    let result;
    try {
        result = await psql`
    SELECT id
    FROM users 
    WHERE email = ${email} 
    LIMIT 1
    `;
    } catch {
        return "ERROR : Failed to fetch data from database.";
    }

    if (result.length == 0) return "ERROR : User are not registered.";
    else {
        let sessionResult;
        try {
            sessionResult = await psql`
        SELECT 1 
        FROM users_sessions 
        WHERE user_id = ${result[0].id} AND session = ${session} 
        LIMIT 1
        `;
        } catch { return "ERROR : Failed to fetch session from database"; }
        if (sessionResult.length == 0) return "ERROR : User are not registered in this sessions.";
        else {
            const qrData = {
                'id': result[0].id,
                'session': session
            };

            const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));

            return qrCode;
        }
    }
}

export async function getActive(id: string, session: string) {
    try {
        const psql = neon(process.env.DATABASE_URL || "");
        return await psql`SELECT 1 FROM active WHERE user_id = ${id} AND session = ${session}`;
    } catch {
        return "ERROR : Failed to fetch active sessions."
    }
}

export async function getSession(id: string, session: string) {
    try {
        const psql = neon(process.env.DATABASE_URL || "");
        return await psql`SELECT 1 FROM users_sessions WHERE user_id = ${id} AND session = ${session}`;
    }
    catch {
        return "ERROR : Failed to fetch all sessions.";
    }
}

export async function deleteActive(id: string, session: string) {
    try {
        const psql = neon(process.env.DATABASE_URL || "");
        await psql`DELETE FROM active WHERE user_id = ${id} AND session = ${session};`;
    } catch {
        return "ERROR : Failed to delete active sessions.";
    }
}

export async function insertActive(id: string, session: string) {
    try {
        const psql = neon(process.env.DATABASE_URL || "");
        await psql`INSERT INTO active (user_id, session) VALUES (${id}, ${session});`;
    } catch (err) {
        if (err instanceof NeonDbError) {
            if (err.message.includes("duplicate key")) { return "ERROR : Already checked-in." }
            return `ERROR : ${err.message}.`;
        }
        else return "ERROR : Failed to insert active session.";
    }
}