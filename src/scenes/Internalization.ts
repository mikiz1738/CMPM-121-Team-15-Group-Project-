import i18next from "i18next";

i18next.init({
    lng: "en",
    fallbackLng: "en",
    debug: true,
    resources: {
        en: {
            translation: {
                instructions: "To move use WASD\n Use spacebar to advance the day\n Use the save and load buttons to save and load your game into that slot\n The undo and redo button undo and redo actions",
                display: "Use the plant buttons to plant into the corresponding cells",
                'Return to Game': 'Return to Game'
            },
            buttons: {
                save1: "Save Slot One",
                save2: "Save Slot Two",
                save3: "Save Slot Three",
                load1: "Load Slot One",
                load2: "Load Slot Two",
                load3: "Load Slot Three",
                undo: "Undo",
                redo: "Redo",
            }
        },
        zh: {
            translation: {
                instructions: "使用WASD移动\n 按空格键进入下一天\n 使用保存和加载按钮保存和加载游戏到对应的存档槽\n 撤销和重做按钮可撤销和重做操作",
                display: "使用种植按钮在对应的单元格中种植",
                'Return to Game': '返回游戏'  // Add this key for Chinese
            },
            buttons: {
                save1: "保存到存档槽一",
                save2: "保存到存档槽二",
                save3: "保存到存档槽三",
                load1: "加载存档槽一",
                load2: "加载存档槽二",
                load3: "加载存档槽三",
                undo: "撤销",
                redo: "重做",
            }
        },
        ar: {
            translation: {
                instructions: "للتحرك استخدم WASD\n اضغط على مفتاح المسافة للتقدم إلى اليوم التالي\n استخدم أزرار الحفظ والتحميل لحفظ لعبتك وتحميلها إلى الفتحة المحددة\n يمكن لزر التراجع والإعادة التراجع عن الإجراءات وإعادتها",
                display: "استخدم أزرار الزرع للزرع في الخلايا المقابلة",
                'Return to Game': 'العودة إلى اللعبة'  // Add this key for Arabic
            },
            buttons: {
                save1: "حفظ في الفتحة الأولى",
                save2: "حفظ في الفتحة الثانية",
                save3: "حفظ في الفتحة الثالثة",
                load1: "تحميل من الفتحة الأولى",
                load2: "تحميل من الفتحة الثانية",
                load3: "تحميل من الفتحة الثالثة",
                undo: "تراجع",
                redo: "إعادة",
            }
        }
    }
}).then(() => {
    // Now it's safe to use i18next.t()
    console.log(i18next.t('instructions')); // Should print the translation for instructions
});;

export default i18next
