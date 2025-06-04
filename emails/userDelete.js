const config = require('../config/index')

module.exports = function(options) {
    return {
        from: config.EMAIL_FROM,
        to: options.email,
        subject: "Ваша учетная запись в системе RQ view удалена",
        html: `
            <!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN">
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>RQ view</title>
            </head>
            
            <body style="box-sizing:border-box; margin:0;">
                <table class="body" style="background:red; min-width:400px; width:100%; background:#ffffff; box-sizing:border-box; font-family:'Arial'; border-collapse:collapse;">
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
                                                                <h1 style="font-family:'Arial'; font-size:24px; line-height:27px; color:#2E2382; margin:0;">Ваша учетная запись в системе RQ view удалена</h1>
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
                                                            <td style="padding-top:33px; padding-bottom:22px; font-weight: 500; font-size: 14px; line-height: 24px; color: #505D6F;">Ваша учетная запись для доступа в систему RQ view удалена. По вопросам, связанным с предоставлением доступа — обратитесь к Администратору.</td>
                                                        </tr>
                                                
                                                        <tr>
                                                            <td style="font-family:'Arial'; font-weight:500; font-size:14px; line-height:24px; color:#505D6F;  padding-bottom:47px;">
                                                                <table style="border-collapse:collapse;">
                                                                    <tr>
                                                                        <td style="font-size:14px; line-height:24px; font-weight:500; color:#505D6F;">ФИО: Наталья Медведева</td>
                                                                    </tr>
            
                                                                    <tr>
                                                                        <td style="font-size:14px; line-height:24px; font-weight:500; color:#505D6F;">Телефон: <a href="+74956205899" style="color:#505D6F; text-decoration:none;">+7 495 620 58 99</a></td>
                                                                    </tr>
            
                                                                    <tr>
                                                                        <td style="font-size:14px; line-height:24px; font-weight:500; color:#505D6F;">Email: <a href="mailto:admin@orm.amdg.ru" style="color:#2E2382;">admin@orm.amdg.ru</a></td>
                                                                    </tr>
                                                                </table>
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