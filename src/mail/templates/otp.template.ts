export const otpTemplate = (otp: string) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <style>
      body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }
      .container { max-width: 480px; margin: 0 auto; background: #fff; border-radius: 10px; padding: 32px; }
      .title { font-size: 22px; font-weight: bold; color: #1a1a1a; }
      .otp-box { font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #4F46E5; margin: 24px 0; }
      .note { color: #666; font-size: 14px; }
    </style>
  </head>
  <body>
    <div class="container">
      <p class="title">Kirish kodi</p>
      <p class="note">Quyidagi kodni kiriting. Kod <strong>1 daqiqa</strong> amal qiladi.</p>
      <div class="otp-box">${otp}</div>
      <p class="note">Agar siz bu so'rovni yubormagan bo'lsangiz, bu xabarni e'tiborsiz qoldiring.</p>
    </div>
  </body>
</html>
`;
