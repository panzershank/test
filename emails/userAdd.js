const config = require('../config/index')

module.exports = function(options) {
    return {
        from: config.EMAIL_FROM,
        to: options.email,
        subject: "Вам предоставлен доступ в систему RQ view",
        html: `
            <!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN">
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>RQ view</title>
            </head>
            
            <body style="box-sizing:border-box; margin:0;">
                <table class="body" style="background:red; width:100%; background:#ffffff; box-sizing:border-box; font-family:'Arial'; border-collapse:collapse;">
                    <tr>
                        <td style="width:40px; width:0px;"></td>
            
                        <td style="width:auto;">
                            <table class="main-wrap" style="width:100%; width:100%; border-collapse:collapse;">
                                <tr>
                                    <td>
                                        <table class="wrap" style="width:100%; width:100%; border-collapse:collapse;">
                                            <tr>
                                                <td style="background:#fff; height:99px; padding-left:40px;">
                                                    <a style="display:inline-block;" href="${config.BASE_URL}" target="_blank">
                                                        <img src="https://rq-view.ru/rq_view_logo.png" style="width:150px;" alt="">
                                                    </a>
                                                </td>
                                        
                                                <td class="status refused" style="height:99px; width:102px;">
                                                    <table style="border-collapse: collapse;">
                                                        <tr>
                                                            <td style="text-align:center; vertical-align:center; height:99px; width:102px; 
                                                            background:#DD1739;">
                                                                <img class="img-await" src="https://amdg.ru/upload/images_lk_mail/attention.png" alt="">
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <table class="wrap" style="background:#F7F9FE; width:100%; border-collapse:collapse; width:100%;">
                                            <tr>
                                                <td width="36"></td>
                                                
                                                <td style="padding-top:38px;">
                                                
                                                    <table class="title" style="border-collapse:collapse;">
                                                        <tr>
                                                            <td style="padding-bottom:26px;">
                                                                <h1 style="font-family:'Arial'; font-size:24px; line-height:27px; color:#2E2382; margin:0;">Вам предоставлен доступ в систему RQ view</h1>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                                
                                                <td width="38"></td>
                                            </tr>
                                        </table>
            
                                        <table class="wrap" style="background:#ffffff; width:100%; border-collapse:collapse; width:100%;">
                                            <tr>
                                                <td width="38"></td>
                                                
                                                <td style="padding-top:27px;">
                                                    <table class="text-unit" style="border-collapse:collapse;">
                                                        <tr>
                                                            <td style="padding-top:33px; padding-bottom:22px; font-weight: 500; font-size: 14px; line-height: 24px; color: #505D6F;">Добро пожаловать в RQ view! Ваш аккаунт готов к работе.</td>
                                                        </tr>
                                                
                                                        <tr>
                                                            <td style="font-family:'Arial'; font-weight:500; font-size:14px; line-height:24px; color:#505D6F;  padding-bottom:28px;">
                                                                <table style="border-collapse:collapse;">
                                                                    <tr>
                                                                        <td style="font-size:14px; line-height:24px; font-weight:500; color:#505D6F;">Логин: <span style="color:#2E2382;">${options.email}</span></td>
                                                                    </tr>
            
                                                                    <tr>
                                                                        <td style="font-size:14px; line-height:24px; font-weight:500; color:#505D6F;">Пароль: <span style="color:#2E2382;">${options.password}</span></td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
            
                                                        <tr>
                                                            <td style="padding-bottom:57px; width:219px;">
                                                                <a href="${config.BASE_URL}" style="text-decoration:none;">
                                                                    <table style="border-collapse:collapse; background:#E00C3C;">
                                                                        <tr>
                                                                            <td style="font-size:18px; line-height:22px; color:#fff;  width:219px; height:63px; text-align:center; vertical-align:middle;">Войти в систему</td>
                                                                        </tr>
                                                                    </table>
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                                
                                                <td width="38"></td>
                                            </tr>
                                        </table>
                                        
                                        <table class="footer" style="border-collapse:collapse; background:#ffffff; width:100%; ">
                                            <tr>
                                                <td width="38"></td>
                                        
                                                <td style="border-top: 1px solid #D0DDEF; padding:18px 0 32px; font-size:12px; line-height:24px; color:#D0DDEF;">
                                                    Сервисное уведомление системы ORM. Данная ветка писем является конфиденциальной.<br>
                                                    Данное сообщение отправлено автоматически. Пожалуйста не отвечайте на него.
                                                </td>
                                        
                                                <td width="38"></td>
                                            </tr>
                                        </table>
                                    </td>
            
                                    <!-- <td style="width:40px;"></td> -->
                                </tr>
                            </table>
                        </td>
            
                        <td style="width:40px; width:0px;"></td>
                    </tr>
                </table>
            </body>
            </html>
        `
    }
}