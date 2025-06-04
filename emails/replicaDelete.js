const config = require('../config/index')
const statusesList = require('../utils/statuses')

module.exports = function(options) {
    const statusInfo = {
        bg: '',
        class: '',
        img: '',
        name: '',
    }

    if (options.status === statusesList.created) {
        statusInfo.bg = 'FF4A00'
        statusInfo.class = 'img-created'
        statusInfo.img = 'created.png'
        statusInfo.name = 'Создана'
    } else if (options.status === statusesList.waiting) {
        statusInfo.bg = '2E2382'
        statusInfo.class = 'img-await'
        statusInfo.img = 'await.png'
        statusInfo.name = 'Ожидает согласования'
    } else if (options.status === statusesList.posting) {
        statusInfo.bg = '119E00'
        statusInfo.class = 'img-on-post'
        statusInfo.img = 'on-post.png'
        statusInfo.name = 'На размещении'
    } else if (options.status === statusesList.moderation) {
        statusInfo.bg = '00AFFF'
        statusInfo.class = 'img-to-moderation'
        statusInfo.img = 'to-moderation.png'
        statusInfo.name = 'Отправлено<br> на модерацию'
    } else if (options.status === statusesList.posted) {
        statusInfo.bg = '94a2b6'
        statusInfo.class = 'posted'
        statusInfo.img = 'refused.png'
        statusInfo.name = 'Размещено'
    } else if (options.status === statusesList.refused) {
        statusInfo.bg = 'E00C3C'
        statusInfo.class = 'img-refused'
        statusInfo.img = 'refused.png'
        statusInfo.name = 'Отклонена'
    }

    return {
        from: config.EMAIL_FROM,
        to: options.email,
        subject: "Реплика удалена",
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
                                        
                                                <td class="status refused" style="height:99px; width:193px; width:167px; background:#${statusInfo.bg}; padding-left: 13px; padding-right:13px;">
                                                    <table>
                                                        <tr>
                                                            <td>
                                                                <img class="${statusInfo.class}" src="https://amdg.ru/upload/images_lk_mail/${statusInfo.img}" alt="">
                                                            </td>
                                        
                                                            <td style="color:#fff; padding-left:13px;">${statusInfo.name}</td>
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
                                                                <h1 style="font-family:'Arial'; font-size:24px; line-height:27px; color:#2E2382; margin:0;">Реплика удалена</h1>
                                                            </td>
                                                        </tr>
                                                    </table>
                                        
                                                    <table class="text-unit" style="border-collapse:collapse;">
                                                        <tr>
                                                            <td style="padding-bottom:6px; font-weight: 500; font-size: 12px; line-height: 15px; color: #94A2B6;">Компания</td>
                                                        </tr>
                                                
                                                        <tr>
                                                            <td style="font-family:'Arial'; font-weight:500; font-size:18px; line-height:22px; color:#2E2382;  padding-bottom:20px;">${options.company}</td>
                                                        </tr>
                                                    </table>
            
                                                    <table class="text-unit" style="border-collapse:collapse;">
                                                        <tr>
                                                            <td style="padding-bottom:6px; font-weight: 500; font-size: 12px; line-height: 15px; color: #94A2B6;">Проект</td>
                                                        </tr>
                                                
                                                        <tr>
                                                            <td style="font-family:'Arial'; font-weight:500; font-size:18px; line-height:22px; color:#2E2382;  padding-bottom:20px;">${options.project}</td>
                                                        </tr>
                                                    </table>
            
                                                    <table class="text-unit" style="border-collapse:collapse;">
                                                        <tr>
                                                            <td style="padding-bottom:6px; font-weight: 500; font-size: 12px; line-height: 15px; color: #94A2B6;">Площадка</td>
                                                        </tr>
                                                
                                                        <tr>
                                                            <td style="font-family:'Arial'; font-weight:500; font-size:18px; line-height:22px; color:#2E2382;  padding-bottom:30px;"><a style="text-decoration:none; color:#2E2382;" href="http://${options.platform}">${options.platform}</a></td>
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
                                                            <td style="padding-bottom:17px; font-weight: 500; font-size: 12px; line-height: 15px; color: #94A2B6;">Реплика</td>
                                                        </tr>
                                                
                                                        <tr>
                                                            <td style="font-family:'Arial'; font-weight:500; font-size:14px; line-height:24px; color:#505D6F;  padding-bottom:29px;">${options.msg}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                                
                                                <td width="38"></td>
                                            </tr>
                                        </table>
            
                                        <table class="wrap" style="background:#ffffff; width:100%; border-collapse:collapse; width:100%;">
                                            <tr>
                                                <td width="38"></td>
                                                
                                                <td style="padding-top:0px;">
                                                    <table class="text-unit" style="border-collapse:collapse;">
                                                        <!--<tr>
                                                            <td style="padding-top:0px; padding-bottom:22px; font-weight: 500; font-size: 14px; line-height: 24px; color: #505D6F;">Реплика была удалена по прчине несоответсвия нормативной лексике.</td>
                                                        </tr>-->
                                                
                                                        <tr>
                                                            <td style="font-family:'Arial'; font-weight:500; font-size:14px; line-height:24px; color:#505D6F;  padding-bottom:47px;">
                                                                <table style="border-collapse:collapse;">
                                                                    <tr>
                                                                        <td style="padding-bottom:6px; font-weight: 500; font-size: 12px; line-height: 15px; color: #94A2B6">Реплику удалил:</td>
                                                                    </tr>
            
                                                                    <tr>
                                                                        <td style="font-size:14px; line-height:24px; font-weight:500; color:#505D6F;">${options.lastName} ${options.name}</td>
                                                                    </tr>
            
                                                                    <tr>
                                                                        <td style="font-size:14px; line-height:24px; font-weight:500; color:#505D6F;">${options.role}</td>
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