const Users = require("../models/dealer_users");
const Roles = require("../models/dealer_roles");
const Dealers = require("../models/dealer_dealers");
const PasswordReset = require('../models/dealer_password_reset'); 
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const shortid = require("shortid")
const crypto = require('crypto');
const sendLoginMail = require("../helpers/sendLoginMail");



exports.post_password_reset = async (req, res) => {
    const { token } = req.params;
    const { newPassword, confirmNewPassword } = req.body;

    try {
        const passwordReset = await PasswordReset.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!passwordReset) {
            return res.status(400).render('auth/password-reset', {
                title: 'Şifre Güncelle',
                alert: {message:'Geçersiz veya süresi dolmuş bir şifre sıfırlama bağlantısı.', class:"danger"},
            });
        }

        if (newPassword !== confirmNewPassword) {
            return res.render('auth/password-reset', {
                title: 'Şifre Güncelle',
                alert: {message:'Yeni şifreler uyuşmuyor.', class:"danger"},
                token
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const user = await Users.findOne({ email: passwordReset.email });
        const dealer = await Dealers.findOne({ email: passwordReset.email });

        if (user) {
            user.password = hashedPassword;
            await user.save();
        }

        if (dealer) {
            dealer.password = hashedPassword;
            await dealer.save();
        }

        res.redirect(`/password/reset/${token}?message=success`);
        await PasswordReset.deleteOne({ resetPasswordToken: token });

    } catch (err) {
        console.log(err);
       
    }
};

exports.get_password_reset = (req,res) => {
    res.render("auth/password-reset",{
        title: "Şifre Güncelle"
    })
}
exports.post_password_forgot = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await Users.findOne({ email });
        const dealer = await Dealers.findOne({ email });

        if (!user && !dealer) {
            return res.render('auth/password-forgot', {
                title: 'Şifre Sıfırlama',
                alert: {message:'Bu e-posta adresi ile kayıtlı bir kullanıcı bulunamadı.', class:"danger"},
            });
        }

        const token = crypto.randomBytes(20).toString('hex');

        const passwordReset = new PasswordReset({
            email,
            resetPasswordToken: token,
            resetPasswordExpires: Date.now() + 3600000
        });

        await passwordReset.save();

       
        const  subject = "Şifre Sıfırlama Talebi"

        const  text = `Şifre sıfırlama talebiniz alınmıştır. Lütfen aşağıdaki bağlantıya tıklayarak şifrenizi sıfırlayın\n\nh<<Buraya Link Ekleyebilirsiniz>>Bu bağlantı 1 saat geçerlidir.`

        sendLoginMail(email,subject,text)

        res.render('auth/password-forgot', {
            title: 'Şifre Sıfırlama',
            alert: {message:'Şifre sıfırlama bağlantınız e-posta adresinize gönderilmiştir.', class:"success"},
        });
    } catch (err) {
        console.log(err);
    }
};
exports.get_password_forgot = (req,res) => {
    res.render("auth/password-forgot",{
        title: "Şifremi Unuttum"
    })
}
exports.get_register = async (req, res) => {
    try {
        return res.render("auth/register", {
            title: "Bayi Kayıt Sayfası"
        });
    } catch (err) {
        console.log(err);
    }
};

exports.post_register = async (req, res) => {
    const{firstName,lastName,email,password,phone} = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        const existingUsers = await Users.findOne({email:email});
        if (existingUsers) {
            return res.render("auth/register", {
                title: "Bayi Kayıt Sayfası",
                message: "Bu e-posta adresi zaten kullanılıyor."
            });
        }

        const userCount = await Users.countDocuments();
        let role;


        if(userCount > 0 ){
            role = await Roles.findOne({name:'moderator'});
            if(!role){
                role = new Roles({
                    name:"moderator"
                })
                await role.save();
            }
        }
        // if (userCount == 0) {
        //     role = await Roles.findOne({name:'admin'});
        //     if(!role){
        //         role = new Roles({
        //             name:"admin"
        //         })
        //         await role.save();
        //     }
        // } else {
        //     role = await Roles.findOne({name:'moderator'});
        //     if(!role){
        //         role = new Roles({
        //             name:"moderator"
        //         })
        //         await role.save();
        //     }
        // }

        const user = new Users({
            firstName,
            lastName,
            email,
            phone,
            userCode: `USR-${shortid.generate()}`,
            password: hashedPassword,
            roles: [role._id]
        });
        await user.save();
        return res.redirect("/login");
    } catch (err) {
        console.log(err);
    }
};

exports.get_login = async (req, res) => {
    try {
        return res.render("auth/login", {
            title: "Bayi Giriş Sayfası"
        });
    } catch (err) {
        console.log(err);
    }
};

exports.post_login = async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    try {
        let user = await Users.findOne({ email }).populate('roles');
        
        if (!user) {
            user = await Dealers.findOne({ email }).populate('roles');
            if (!user) {
                return res.render("auth/login", {
                    title: "Bayi Giriş Yap Sayfası",
                    message: "Kullanıcı Bulunamadı"
                });
            }
           
        }
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            if(user.status != false){

                //jwt
                const token = jwt.sign({ userId: user._id, roles: user.roles.map(role => role.name) }, 'privateKey', { expiresIn: '1h' });
                res.cookie('token', token, { httpOnly: true, maxAge: 3600000 });
                
                req.session.isAuth = true;
                req.session.userId = user._id;
                req.session.fullName = user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1) + " " + user.lastName.charAt(0).toUpperCase()+ user.lastName.slice(1);
                
                req.session.roles = user.roles.map(role => role.name);
                req.session.isAdmin = req.session.roles.includes("admin");
                req.session.isModerator = req.session.roles.includes("moderator") || req.session.roles.includes("admin");
                req.session.isDealer = req.session.roles.includes("dealer") || req.session.roles.includes("subDealer");
                if(req.session.isAdmin || req.session.isModerator){
                    res.redirect("/admin/index");
                }
                if(req.session.isDealer){
                    res.redirect("/user/profile")
                }
            }else{
                return res.render("auth/login", {
                    title: "Bayi Giriş Yap Sayfası",
                    message: "Kullanıcı Pasif - Yöneticiniz ile iletişim kurun"
                });
            }
           
        } else { 
            res.render("auth/login", {
                title: "Bayi Giriş Yap Sayfası",
                message: "Hatalı Parola"
            });
        }
    } catch (err) {
        console.log(err);
    }
};

exports.get_logout = async (req, res) => {
    await req.session.destroy();
    res.clearCookie('token');
    res.clearCookie('connect.sid');

    return res.redirect("/login");
};