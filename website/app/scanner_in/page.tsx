'use client';
import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getSession, insertActive } from "../actions";

const QRCodeScanner = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isScanning, setIsScanning] = useState(true);
    const [selectedSession, setSelectedSession] = useState("");

    const handleSessionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedSession(event.target.value);
    };

    async function scan(scanner: BrowserMultiFormatReader) {
        try {
            await scanner.decodeFromVideoDevice(
                null,
                videoRef.current!,
                async (result, err) => {
                    if (result) {
                        setIsScanning(false);
                        try {
                            const qrData = JSON.parse(result.getText());
                            if (!qrData.hasOwnProperty('id') || !qrData.hasOwnProperty('session')) {
                                toast.error('Invalid QR Code', {
                                    position: "top-center",
                                    onClose: () => setIsScanning(true)
                                });
                            }
                            else {
                                console.log(selectedSession);
                                if (qrData.session != selectedSession) {
                                    toast.error("Wrong session!", {
                                        position: "top-center",
                                        onClose: () => setIsScanning(true)
                                    });
                                } else {
                                    const session = await getSession(qrData.id, qrData.session);
                                    if (typeof session === "string") {
                                        toast.error(`${session.split(/\s*:\s*/)[1]}`, {
                                            position: "top-center",
                                            onClose: () => setIsScanning(true)
                                        });
                                    } else {
                                        const insert = await insertActive(qrData.id, qrData.session);
                                        if (typeof insert === "string") {
                                            toast.error(`${insert.split(/\s*:\s*/)[1]}`, {
                                                position: "top-center",
                                                onClose: () => setIsScanning(true)
                                            });
                                        } else {
                                            toast.success(`Checked In!`, {
                                                position: "top-center",
                                                onClose: () => setIsScanning(true)
                                            });
                                        }
                                    }
                                }
                            }
                        } catch {
                            toast.error('Invalid QR Code (Invalid JSON Data)', {
                                position: "top-center",
                                onClose: () => setIsScanning(true)
                            })
                        }
                    } else if (err) {
                        console.warn(err.message);
                    }
                }
            );
        } catch (err) {
            toast.error(`Error initializing scanner`, {
                position: "top-center",
            });
        }
    }

    useEffect(() => {
        const scanner = new BrowserMultiFormatReader();

        if (isScanning) scan(scanner);

        return () => {
            scanner.reset();
        };

    }, [isScanning, selectedSession]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            textAlign: 'center'
        }}>
            {/* Dropdown Menu */}
            <select
                value={selectedSession}
                onChange={handleSessionChange}
                style={{
                    marginBottom: '20px',
                    padding: '10px',
                    fontSize: '16px',
                    borderRadius: '5px',
                    border: '1px solid #ccc',
                }}
            >
                <option value="" disabled hidden>Select a Session</option>
                <option value="Friday, January 24th, 2025">Friday, January 24th, 2025</option>
                <option value="Saturday, January 25th, 2025">Saturday, January 25th, 2025</option>
                <option value="Sunday, January 26th, 2025">Sunday, January 26th, 2025</option>
            </select>

            {/* Video Feed */}
            <video ref={videoRef} style={{ width: "100%", maxHeight: "400px" }} />

            <ToastContainer />

            {!isScanning && <div style={{ fontSize: '24px', fontWeight: 'bold' }}>LOADING</div>}
        </div>
    );
};

export default QRCodeScanner;
