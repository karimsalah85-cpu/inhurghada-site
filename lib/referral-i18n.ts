import type { Locale } from "@/lib/i18n";

type ReferralCopy = {
  heading: string; tagline: string; yourCode: string; copyCode: string; copied: string; copyLink: string; shareWhatsapp: string;
  whatsappMessage: string; available: string; maxPerBooking: string; pending: string; qualified: string;
  sendCode: string; enterCodeLabel: string; verify: string; invalidCode: string;
  applyPrompt: (percent: number) => string; applyButton: string; applied: string; noRewardsYet: string;
  checkoutCodeLabel: string; checkoutApply: string; checkoutRemove: string; checkoutDiscount: string; checkoutHint: string;
};

export const referralCopy: Record<Locale, ReferralCopy> = {
  en: { heading: "GIVE 5% — EARN 5%", tagline: "Give friends 5% off their first eligible booking. After they complete their experience, you earn 5% off a future booking.", yourCode: "Your referral code", copyCode: "Copy code", copied: "Copied!", copyLink: "Copy referral link", shareWhatsapp: "Share on WhatsApp", whatsappMessage: "Explore the Red Sea with Daily Red Sea! Use my link and get 5% off your first eligible booking.", available: "Available rewards", maxPerBooking: "Maximum usable on one booking", pending: "Pending", qualified: "Successful referrals", sendCode: "Send verification code", enterCodeLabel: "Verification code", verify: "Verify", invalidCode: "That code is incorrect or has expired.", applyPrompt: (percent) => `You have ${percent}% in referral rewards. Apply it to this booking?`, applyButton: "Apply to this booking", applied: "Referral reward applied", noRewardsYet: "No referral rewards yet — share your link to start earning.", checkoutCodeLabel: "Referral code", checkoutApply: "Apply", checkoutRemove: "Remove", checkoutDiscount: "Referral discount", checkoutHint: "Have a friend's referral code? Enter it here." },
  ar: { heading: "امنح 5% — اكسب 5%", tagline: "امنح أصدقاءك خصم 5% على أول حجز مؤهل لهم. وبعد إتمام رحلتهم، تحصل أنت على خصم 5% لحجز قادم.", yourCode: "رمز الإحالة الخاص بك", copyCode: "نسخ الرمز", copied: "تم النسخ!", copyLink: "نسخ رابط الإحالة", shareWhatsapp: "مشاركة عبر واتساب", whatsappMessage: "اكتشف البحر الأحمر مع ديلي رِد سي! استخدم رابطي واحصل على خصم 5% على أول حجز مؤهل لك.", available: "المكافآت المتاحة", maxPerBooking: "الحد الأقصى للاستخدام في حجز واحد", pending: "قيد الانتظار", qualified: "الإحالات الناجحة", sendCode: "إرسال رمز التحقق", enterCodeLabel: "رمز التحقق", verify: "تحقق", invalidCode: "الرمز غير صحيح أو منتهي الصلاحية.", applyPrompt: (percent) => `لديك ${percent}% من مكافآت الإحالة. هل تريد تطبيقها على هذا الحجز؟`, applyButton: "تطبيق على هذا الحجز", applied: "تم تطبيق مكافأة الإحالة", noRewardsYet: "لا توجد مكافآت إحالة بعد — شارك رابطك لتبدأ بالكسب.", checkoutCodeLabel: "رمز الإحالة", checkoutApply: "تطبيق", checkoutRemove: "إزالة", checkoutDiscount: "خصم الإحالة", checkoutHint: "هل لديك رمز إحالة من صديق؟ أدخله هنا." },
  de: { heading: "GIB 5% — VERDIENE 5%", tagline: "Gib Freunden 5% Rabatt auf ihre erste berechtigte Buchung. Nach ihrer Reise erhältst du 5% Rabatt auf eine künftige Buchung.", yourCode: "Dein Empfehlungscode", copyCode: "Code kopieren", copied: "Kopiert!", copyLink: "Empfehlungslink kopieren", shareWhatsapp: "Auf WhatsApp teilen", whatsappMessage: "Entdecke das Rote Meer mit Daily Red Sea! Nutze meinen Link und erhalte 5% Rabatt auf deine erste berechtigte Buchung.", available: "Verfügbare Prämien", maxPerBooking: "Maximal nutzbar pro Buchung", pending: "Ausstehend", qualified: "Erfolgreiche Empfehlungen", sendCode: "Bestätigungscode senden", enterCodeLabel: "Bestätigungscode", verify: "Bestätigen", invalidCode: "Dieser Code ist falsch oder abgelaufen.", applyPrompt: (percent) => `Du hast ${percent}% Empfehlungsprämien. Auf diese Buchung anwenden?`, applyButton: "Auf diese Buchung anwenden", applied: "Empfehlungsprämie angewendet", noRewardsYet: "Noch keine Empfehlungsprämien — teile deinen Link, um zu verdienen.", checkoutCodeLabel: "Empfehlungscode", checkoutApply: "Anwenden", checkoutRemove: "Entfernen", checkoutDiscount: "Empfehlungsrabatt", checkoutHint: "Hast du den Empfehlungscode eines Freundes? Hier eingeben." },
  ru: { heading: "ПОДАРИ 5% — ЗАРАБОТАЙ 5%", tagline: "Подарите друзьям скидку 5% на первое подходящее бронирование. После завершения их поездки вы получите скидку 5% на будущее бронирование.", yourCode: "Ваш реферальный код", copyCode: "Скопировать код", copied: "Скопировано!", copyLink: "Скопировать реферальную ссылку", shareWhatsapp: "Поделиться в WhatsApp", whatsappMessage: "Откройте для себя Красное море с Daily Red Sea! Используйте мою ссылку и получите скидку 5% на первое подходящее бронирование.", available: "Доступные вознаграждения", maxPerBooking: "Максимум на одно бронирование", pending: "В ожидании", qualified: "Успешные рефералы", sendCode: "Отправить код подтверждения", enterCodeLabel: "Код подтверждения", verify: "Подтвердить", invalidCode: "Код неверен или истёк.", applyPrompt: (percent) => `У вас есть ${percent}% реферальных вознаграждений. Применить к этому бронированию?`, applyButton: "Применить к этому бронированию", applied: "Реферальное вознаграждение применено", noRewardsYet: "Пока нет реферальных вознаграждений — поделитесь ссылкой, чтобы начать зарабатывать.", checkoutCodeLabel: "Реферальный код", checkoutApply: "Применить", checkoutRemove: "Удалить", checkoutDiscount: "Реферальная скидка", checkoutHint: "Есть реферальный код друга? Введите его здесь." },
  pl: { heading: "DAJ 5% — ZYSKAJ 5%", tagline: "Daj znajomym 5% zniżki na pierwszą kwalifikującą się rezerwację. Po zakończeniu ich wycieczki ty zyskujesz 5% zniżki na kolejną rezerwację.", yourCode: "Twój kod polecający", copyCode: "Kopiuj kod", copied: "Skopiowano!", copyLink: "Kopiuj link polecający", shareWhatsapp: "Udostępnij w WhatsApp", whatsappMessage: "Odkryj Morze Czerwone z Daily Red Sea! Użyj mojego linku i zyskaj 5% zniżki na pierwszą kwalifikującą się rezerwację.", available: "Dostępne nagrody", maxPerBooking: "Maksymalnie do wykorzystania w jednej rezerwacji", pending: "Oczekujące", qualified: "Skuteczne polecenia", sendCode: "Wyślij kod weryfikacyjny", enterCodeLabel: "Kod weryfikacyjny", verify: "Zweryfikuj", invalidCode: "Ten kod jest nieprawidłowy lub wygasł.", applyPrompt: (percent) => `Masz ${percent}% nagród polecających. Zastosować do tej rezerwacji?`, applyButton: "Zastosuj do tej rezerwacji", applied: "Nagroda polecająca zastosowana", noRewardsYet: "Brak jeszcze nagród polecających — udostępnij swój link, aby zacząć zarabiać.", checkoutCodeLabel: "Kod polecający", checkoutApply: "Zastosuj", checkoutRemove: "Usuń", checkoutDiscount: "Zniżka polecająca", checkoutHint: "Masz kod polecający znajomego? Wpisz go tutaj." },
  zh: { heading: "赠 5% — 赚 5%", tagline: "邀请好友享受首次符合条件预订的 5% 折扣。好友完成行程后，您将获得未来预订的 5% 折扣。", yourCode: "您的推荐码", copyCode: "复制推荐码", copied: "已复制！", copyLink: "复制推荐链接", shareWhatsapp: "通过 WhatsApp 分享", whatsappMessage: "与 Daily Red Sea 一起探索红海！使用我的链接，即可在首次符合条件的预订中享受 5% 折扣。", available: "可用奖励", maxPerBooking: "单次预订最多可用", pending: "待定", qualified: "成功推荐", sendCode: "发送验证码", enterCodeLabel: "验证码", verify: "验证", invalidCode: "验证码不正确或已过期。", applyPrompt: (percent) => `您有 ${percent}% 的推荐奖励，是否应用到本次预订？`, applyButton: "应用到本次预订", applied: "已应用推荐奖励", noRewardsYet: "暂无推荐奖励——分享您的链接即可开始赚取。", checkoutCodeLabel: "推荐码", checkoutApply: "应用", checkoutRemove: "移除", checkoutDiscount: "推荐折扣", checkoutHint: "有朋友的推荐码？在此输入。" },
};

export const referralProgramCopy = {
  "en": {
    "locked": "Complete your first paid Daily Red Sea experience to unlock referrals.",
    "emailLabel": "Email used for your booking",
    "verifyIntro": "Verify your booking email to view your referral link and rewards.",
    "codeSentNotice": "If this email is eligible for verification, a 6-digit code will arrive by email. Check your spam folder too.",
    "resend": "Send another code",
    "requestError": "Something went wrong. Please try again.",
    "copyError": "Copy failed. Please try again or use WhatsApp.",
    "terms": "Referral rewards are discounts on eligible future bookings, not cash. They cannot be withdrawn or transferred. Use up to 15% per booking; unused rewards stay available.",
    "howItWorks": "How it works",
    "stepOne": "Complete and pay for your first trip to unlock your personal link.",
    "stepTwo": "Give a genuinely new friend 5% off their first eligible booking.",
    "stepThree": "After their trip is completed and paid, earn another 5%. Rewards accumulate.",
    "viewRewards": "View my referral rewards",
    "continueBooking": "Continue to booking",
    "stackingPolicy": "Your rewards will be checked at checkout. The better eligible discount applies; percentage discounts do not stack."
  },
  "ar": {
    "locked": "أكمل تجربتك الأولى المدفوعة مع ديلي رِد سي لتفعيل الإحالات.",
    "emailLabel": "البريد الإلكتروني المستخدم للحجز",
    "verifyIntro": "تحقق من بريد الحجز لعرض رابط الإحالة ومكافآتك.",
    "codeSentNotice": "إذا كان هذا البريد مؤهلاً للتحقق، فسيصلك رمز من 6 أرقام عبر البريد. تحقق من البريد غير المرغوب أيضاً.",
    "resend": "إرسال رمز آخر",
    "requestError": "حدث خطأ. يرجى المحاولة مجدداً.",
    "copyError": "تعذر النسخ. حاول مجدداً أو استخدم واتساب.",
    "terms": "مكافآت الإحالة خصومات على حجوزات مستقبلية مؤهلة وليست نقداً. لا يمكن سحبها أو تحويلها. استخدم حتى 15% لكل حجز، ويبقى الرصيد غير المستخدم متاحاً.",
    "howItWorks": "كيف تعمل",
    "stepOne": "أكمل رحلتك الأولى وادفع قيمتها لتفعيل رابطك الشخصي.",
    "stepTwo": "امنح صديقاً جديداً فعلياً خصم 5% على أول حجز مؤهل له.",
    "stepThree": "بعد اكتمال رحلته وسدادها، تكسب 5% أخرى. وتتراكم المكافآت.",
    "viewRewards": "عرض مكافآت الإحالة",
    "continueBooking": "متابعة إلى الحجز",
    "stackingPolicy": "تُراجع مكافآتك عند الحجز. يُطبق أفضل خصم مؤهل، ولا تُجمع الخصومات المئوية."
  },
  "de": {
    "locked": "Schließe deine erste bezahlte Daily Red Sea Reise ab, um Empfehlungen freizuschalten.",
    "emailLabel": "E-Mail deiner Buchung",
    "verifyIntro": "Bestätige deine Buchungs-E-Mail, um deinen Link und deine Prämien zu sehen.",
    "codeSentNotice": "Wenn diese E-Mail zur Bestätigung berechtigt ist, erhältst du einen sechsstelligen Code per E-Mail. Prüfe auch den Spamordner.",
    "resend": "Neuen Code senden",
    "requestError": "Etwas ist schiefgelaufen. Bitte versuche es erneut.",
    "copyError": "Kopieren fehlgeschlagen. Versuche es erneut oder nutze WhatsApp.",
    "terms": "Empfehlungsprämien sind Rabatte auf berechtigte künftige Buchungen, kein Bargeld. Sie sind weder auszahlbar noch übertragbar. Nutze bis zu 15% pro Buchung; der Rest bleibt erhalten.",
    "howItWorks": "So funktioniert es",
    "stepOne": "Schließe deine erste Reise ab und bezahle sie, um deinen persönlichen Link freizuschalten.",
    "stepTwo": "Schenke einem wirklich neuen Kunden 5% Rabatt auf seine erste berechtigte Buchung.",
    "stepThree": "Nach seiner abgeschlossenen und bezahlten Reise verdienst du weitere 5%. Prämien sammeln sich an.",
    "viewRewards": "Meine Empfehlungsprämien",
    "continueBooking": "Weiter zur Buchung",
    "stackingPolicy": "Deine Prämien werden bei der Buchung geprüft. Der bessere berechtigte Rabatt gilt; prozentuale Rabatte werden nicht kombiniert."
  },
  "ru": {
    "locked": "Завершите и оплатите первую поездку с Daily Red Sea, чтобы открыть рекомендации.",
    "emailLabel": "Email, указанный при бронировании",
    "verifyIntro": "Подтвердите email бронирования, чтобы увидеть ссылку и вознаграждения.",
    "codeSentNotice": "Если этот email доступен для подтверждения, на него придёт шестизначный код. Проверьте также папку «Спам».",
    "resend": "Отправить код повторно",
    "requestError": "Произошла ошибка. Попробуйте ещё раз.",
    "copyError": "Не удалось скопировать. Попробуйте снова или используйте WhatsApp.",
    "terms": "Вознаграждения — скидки на подходящие будущие бронирования, а не деньги. Их нельзя вывести или передать. Используйте до 15% на одно бронирование; остаток сохраняется.",
    "howItWorks": "Как это работает",
    "stepOne": "Завершите и оплатите первую поездку, чтобы получить личную ссылку.",
    "stepTwo": "Подарите действительно новому клиенту скидку 5% на первое подходящее бронирование.",
    "stepThree": "После завершения и оплаты его поездки вы заработаете ещё 5%. Вознаграждения накапливаются.",
    "viewRewards": "Мои вознаграждения",
    "continueBooking": "Перейти к бронированию",
    "stackingPolicy": "Вознаграждения проверяются при оформлении. Применяется наиболее выгодная доступная скидка; процентные скидки не суммируются."
  },
  "pl": {
    "locked": "Ukończ i opłać pierwszą wycieczkę Daily Red Sea, aby odblokować polecenia.",
    "emailLabel": "E-mail użyty przy rezerwacji",
    "verifyIntro": "Zweryfikuj e-mail rezerwacji, aby zobaczyć swój link i nagrody.",
    "codeSentNotice": "Jeśli ten e-mail kwalifikuje się do weryfikacji, otrzymasz sześciocyfrowy kod e-mailem. Sprawdź też spam.",
    "resend": "Wyślij kod ponownie",
    "requestError": "Coś poszło nie tak. Spróbuj ponownie.",
    "copyError": "Kopiowanie nie powiodło się. Spróbuj ponownie lub użyj WhatsApp.",
    "terms": "Nagrody to zniżki na przyszłe kwalifikujące się rezerwacje, nie gotówka. Nie można ich wypłacić ani przenieść. Wykorzystaj do 15% na rezerwację; reszta pozostaje dostępna.",
    "howItWorks": "Jak to działa",
    "stepOne": "Ukończ i opłać pierwszą wycieczkę, aby odblokować osobisty link.",
    "stepTwo": "Podaruj rzeczywiście nowemu klientowi 5% zniżki na pierwszą kwalifikującą się rezerwację.",
    "stepThree": "Po ukończeniu i opłaceniu jego wycieczki zyskasz kolejne 5%. Nagrody się sumują.",
    "viewRewards": "Moje nagrody za polecenia",
    "continueBooking": "Przejdź do rezerwacji",
    "stackingPolicy": "Nagrody zostaną sprawdzone przy rezerwacji. Obowiązuje korzystniejsza dostępna zniżka; rabaty procentowe nie łączą się."
  },
  "zh": {
    "locked": "完成并支付您的首次 Daily Red Sea 行程，即可解锁推荐。",
    "emailLabel": "预订时使用的电子邮箱",
    "verifyIntro": "验证预订邮箱，即可查看您的推荐链接和奖励。",
    "codeSentNotice": "如果此邮箱符合验证条件，您将收到六位数邮件验证码。请同时检查垃圾邮件。",
    "resend": "重新发送验证码",
    "requestError": "发生错误，请重试。",
    "copyError": "复制失败。请重试或使用 WhatsApp。",
    "terms": "推荐奖励是未来符合条件预订的折扣，不是现金，不能提现或转让。每次预订最多使用 15%，未使用的奖励仍会保留。",
    "howItWorks": "参与方式",
    "stepOne": "完成并支付首次行程，解锁您的专属链接。",
    "stepTwo": "让真正的新客户在首次符合条件预订时享受 5% 折扣。",
    "stepThree": "好友完成并支付行程后，您再赚取 5%。奖励可累积。",
    "viewRewards": "查看我的推荐奖励",
    "continueBooking": "继续预订",
    "stackingPolicy": "奖励将在结账时验证。适用更优惠的折扣；百分比折扣不可叠加。"
  }
} satisfies Record<Locale, Record<string, string>>;

export const referralRemainingCopy: Record<Locale, (percent: number) => string> = {
  en: (percent) => `${percent}% will remain available for a future booking if this reward is used.`,
  ar: (percent) => `سيبقى ${percent}% متاحاً لحجز مستقبلي إذا استخدمت هذه المكافأة.`,
  de: (percent) => `${percent}% bleiben für eine spätere Buchung erhalten, wenn du diese Prämie nutzt.`,
  ru: (percent) => `Если использовать это вознаграждение, ${percent}% останется для будущего бронирования.`,
  pl: (percent) => `Jeśli wykorzystasz tę nagrodę, ${percent}% pozostanie na przyszłą rezerwację.`,
  zh: (percent) => `使用此奖励后，仍有 ${percent}% 可用于未来预订。`,
};
