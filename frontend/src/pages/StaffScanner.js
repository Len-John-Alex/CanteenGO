import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { orderService } from '../services/orderService';
import { useNotification } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import './StaffScanner.css';

const StaffScanner = () => {
    const [scanResult, setScanResult] = useState(null);
    const [isScannerStarted, setIsScannerStarted] = useState(false);
    const [error, setError] = useState(null);

    const isProcessingRef = useRef(false);
    const scannerRef = useRef(null);
    const isMountedRef = useRef(true);
    const readerIdRef = useRef(`reader-${Math.random().toString(36).substr(2, 9)}`);

    const { showNotification } = useNotification();
    const navigate = useNavigate();

    const stopScanner = async () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            try {
                await scannerRef.current.stop();
                if (isMountedRef.current) {
                    setIsScannerStarted(false);
                }
            } catch (err) {
                console.warn("Stop error:", err);
            }
        }
    };

    const startScanner = async () => {
        if (!scannerRef.current || !isMountedRef.current) return;
        if (scannerRef.current.isScanning) return;

        try {
            const config = { fps: 10, qrbox: { width: 250, height: 250 } };
            await scannerRef.current.start(
                { facingMode: "environment" },
                config,
                onScanSuccess
            );

            if (isMountedRef.current) {
                setIsScannerStarted(true);
                setError(null);
            }
        } catch (err) {
            console.error("Scanner start error:", err);
            if (isMountedRef.current) {
                setError("Camera error: " + (err.message || "Access denied"));
            }
        }
    };

    const onScanSuccess = async (decodedText) => {
        if (isProcessingRef.current || !isMountedRef.current) return;

        try {
            const data = JSON.parse(decodedText);
            if (data.orderId) {
                isProcessingRef.current = true;
                setScanResult(`Checking Order #${data.orderId}...`);

                await stopScanner();

                try {
                    // Fetch current order details to check status
                    const order = await orderService.getOrderDetails(data.orderId);

                    if (order.status === 'COMPLETED') {
                        setScanResult(`Order #${data.orderId} is ALREADY COMPLETED.`);
                        showNotification(`Order #${data.orderId} was already processed.`, 'info');
                    } else if (order.status === 'CANCELLED') {
                        setScanResult(`Order #${data.orderId} is CANCELLED!`);
                        showNotification(`Cannot complete a cancelled order.`, 'error');
                    } else {
                        // Proceed to complete
                        await orderService.updateStatus(data.orderId, 'COMPLETED');
                        showNotification(`Order #${data.orderId} completed successfully!`, 'success');
                        setScanResult(`Success! Order #${data.orderId} marked as COMPLETED.`);
                    }
                } catch (apiErr) {
                    console.error('API Error:', apiErr);
                    showNotification(`Error: Could not retrieve or update order #${data.orderId}`, 'error');
                    setScanResult(`Error processing order #${data.orderId}`);
                }

                // Restart scanner after 4 seconds
                setTimeout(async () => {
                    if (isMountedRef.current) {
                        setScanResult(null);
                        isProcessingRef.current = false;
                        await startScanner();
                    }
                }, 4000);
            }
        } catch (err) {
            // Ignore invalid scans
        }
    };

    useEffect(() => {
        isMountedRef.current = true;
        const currentReaderId = readerIdRef.current;
        const scanner = new Html5Qrcode(currentReaderId);
        scannerRef.current = scanner;

        // Force a small delay to ensure DOM is fully ready
        const timer = setTimeout(() => {
            if (isMountedRef.current) startScanner();
        }, 300);

        return () => {
            isMountedRef.current = false;
            clearTimeout(timer);

            const cleanup = async () => {
                if (scanner) {
                    try {
                        if (scanner.isScanning) {
                            await scanner.stop();
                        }
                    } catch (e) { }
                    try {
                        scanner.clear();
                    } catch (e) { }
                }

                // Global fallback for this specific unique ID
                const container = document.getElementById(currentReaderId);
                if (container) {
                    container.querySelectorAll('video').forEach(video => {
                        if (video.srcObject) {
                            video.srcObject.getTracks().forEach(t => t.stop());
                            video.srcObject = null;
                        }
                        video.remove();
                    });
                    container.innerHTML = '';
                }

                // Nuclear fallback: stop ANY active video on the screen as a generic cleanup
                document.querySelectorAll('video').forEach(v => {
                    if (v.srcObject) {
                        v.srcObject.getTracks().forEach(t => t.stop());
                    }
                });

                scannerRef.current = null;
            };

            cleanup();
        };
    }, []);

    const getFeedbackClass = () => {
        if (!scanResult) return '';
        if (scanResult.includes('ALREADY') || scanResult.includes('CANCELLED')) return 'warning';
        if (scanResult.includes('Success')) return 'success';
        return 'processing';
    };

    return (
        <div className="scanner-container">
            <header className="scanner-header">
                <button className="back-btn" onClick={() => navigate('/dashboard')}>
                    &larr; Back
                </button>
                <h1>Order QR Scanner</h1>
            </header>

            <div className="scanner-main">
                <div id={readerIdRef.current} className="qr-reader-target" style={{ width: '100%', minHeight: '250px' }}></div>

                {error && <div className="scanner-error">{error}</div>}

                {!isScannerStarted && !scanResult && !error && (
                    <button className="start-scanner-btn" onClick={startScanner}>
                        Restart Camera
                    </button>
                )}

                {scanResult && (
                    <div className={`scan-feedback ${getFeedbackClass()}`}>
                        {scanResult}
                    </div>
                )}

                <div className="scanner-guide">
                    <h3>Instructions</h3>
                    <ul>
                        <li>Align the student's receipt QR code within the frame.</li>
                        <li>Scanning is automatic. Keep it steady.</li>
                        <li>Once scanned, the order is marked <strong>COMPLETED</strong>.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default StaffScanner;
