import nodemailer from 'nodemailer';

// Tạo transporter lazy — đảm bảo dotenv đã load xong
const getTransporter = () =>
    nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });

export const sendOTPEmail = async (toEmail, otp) => {
    const transporter = getTransporter();

    await transporter.sendMail({
        from: `"FastFoot" <${process.env.GMAIL_USER}>`,
        to: toEmail,
        subject: 'Mã xác nhận đăng ký tài khoản FastFoot',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
                <div style="background: #c8102e; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">🍕 FastFoot</h1>
                </div>
                <div style="background: #fff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                    <h2 style="color: #1a1a1a; margin-top: 0;">Xác nhận đăng ký tài khoản</h2>
                    <p style="color: #555; font-size: 15px;">Mã OTP của bạn là:</p>
                    <div style="background: #fff5f5; border: 2px solid #c8102e; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
                        <span style="font-size: 40px; font-weight: 700; letter-spacing: 12px; color: #c8102e;">${otp}</span>
                    </div>
                    <p style="color: #888; font-size: 13px;">Mã có hiệu lực trong <strong>5 phút</strong>. Không chia sẻ mã này với bất kỳ ai.</p>
                    <p style="color: #aaa; font-size: 12px; margin-bottom: 0;">Nếu bạn không yêu cầu đăng ký, hãy bỏ qua email này.</p>
                </div>
            </div>
        `,
    });
};
