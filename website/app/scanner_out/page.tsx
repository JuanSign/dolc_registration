'use client';
import React, { act, useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { deleteActive, getActive, getSession, insertActive } from "../actions";

const QRCodeScanner = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isScanning, setIsScanning] = useState(true);

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
                                const active = await getActive(qrData.id, qrData.session);
                                if (typeof active === "string") {
                                    toast.error(`${active.split(/\s*:\s*/)[1]}`, {
                                        position: "top-center",
                                        onClose: () => setIsScanning(true)
                                    });
                                } else {
                                    if (active.length == 0) {
                                        toast.error("User are not checked-in in this session", {
                                            position: "top-center",
                                            onClose: () => setIsScanning(true)
                                        });
                                    }
                                    else {
                                        const deletion = await deleteActive(qrData.id, qrData.session);
                                        if (typeof deletion === "string") {
                                            toast.error(`${deletion.split(/\s*:\s*/)[1]}`, {
                                                position: "top-center",
                                                onClose: () => setIsScanning(true)
                                            });
                                        } else {
                                            toast.success(`Logged out!`, {
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

    }, [isScanning]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            textAlign: 'center'
        }}>
            <video ref={videoRef} style={{ width: "100%", maxHeight: "400px" }} />
            <ToastContainer />
            {!isScanning && <div style={{ fontSize: '24px', fontWeight: 'bold' }}>LOADING</div>}
        </div>

    );
};

export default QRCodeScanner;
