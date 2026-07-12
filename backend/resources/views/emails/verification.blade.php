<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Подтверждение регистрации</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f5;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 500px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 48px;
        }
        h1 {
            color: #451a03;
            margin-top: 0;
        }
        .code {
            font-size: 36px;
            font-weight: 700;
            text-align: center;
            padding: 20px;
            background: #fef3c7;
            border-radius: 12px;
            letter-spacing: 8px;
            margin: 30px 0;
            color: #ea580c;
        }
        .btn {
            display: inline-block;
            background: #ea580c;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 30px;
            font-weight: 600;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            color: #6b7280;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🥖</div>
            <h1>Домашняя Пекарня</h1>
        </div>
        
        <p>Здравствуйте, <strong>{{ $name }}</strong>!</p>
        <p>Вы зарегистрировались на нашем сайте. Для завершения регистрации введите код подтверждения:</p>
        
        <div class="code">{{ $code }}</div>
        
        <p style="text-align: center;">
            <a href="#" class="btn">Подтвердить регистрацию</a>
        </p>
        
        <div class="footer">
            <p>Код действителен в течение 10 минут.<br>
            Если вы не регистрировались на нашем сайте, просто проигнорируйте это письмо.</p>
            <p>&copy; 2024 Домашняя Пекарня. Все права защищены.</p>
        </div>
    </div>
</body>
</html>