import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import { useToast } from '../context/ToastContext';
import { formatDateInAden, formatDateTimeInAden } from '../utils/dateUtils';
import { AddDependentModal } from './AddDependentModal';
import { 
  Users, 
  Share2, 
  Copy, 
  Check, 
  UserMinus, 
  ShieldCheck, 
  Shield,
  Activity, 
  Calendar, 
  Plus, 
  Trash2,
  Sparkles,
  Info,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  UserPlus
} from 'lucide-react';

interface GroupViewProps {
  onOpenCreateTask: () => void;
  onOpenJoinGroup: () => void;
}

export const GroupView: React.FC<GroupViewProps> = ({
  onOpenCreateTask,
  onOpenJoinGroup,
}) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const { 
    currentGroup, 
    members, 
    tasks, 
    activityFeed, 
    isCurrentUserAdmin,
    removeMember,
    updateMemberRole,
    generateInviteCode,
    deleteGroup,
    removeDependentFromGroup
  } = useGroup();

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'activity' | 'tasks'>('members');
  const [inviteCode, setInviteCode] = useState<string>('RIFQA-INV');
  const [showGuide, setShowGuide] = useState(true);
  const [addDependentModalOpen, setAddDependentModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Load or generate code
  React.useEffect(() => {
    if (currentGroup) {
      generateInviteCode(currentGroup.id).then(code => setInviteCode(code)).catch(() => {});
    }
  }, [currentGroup?.id]);

  const baseUrl = (typeof window !== 'undefined' && !window.location.origin.includes('localhost') && !window.location.origin.includes('127.0.0.1'))
    ? window.location.origin
    : 'https://ais-pre-yjyql7tinccbn4mjxwcqgc-485443738619.europe-west1.run.app';
  
  const inviteUrl = `${baseUrl}/?invite=${inviteCode}`;

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopiedCode(true);
    showToast(`تم نسخ رمز الدعوة (${inviteCode}) بنجاح!`, 'success');
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyFullMessage = () => {
    const message = `السلام عليكم ورحمة الله،\nأدعوك للانضمام إلى مجموعة "${currentGroup?.name}" في منصة "رفقة الإنجاز" لمتابعة الختمات والأوراد الجماعية.\n\n🔗 رابط الانضمام المباشر:\n${inviteUrl}\n\n🔑 رمز الدعوة:\n${inviteCode}`;
    navigator.clipboard.writeText(message);
    setCopiedLink(true);
    showToast('تم نسخ رسالة الدعوة لرابط الواتساب بنجاح!', 'success');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareInvite = () => {
    const textMsg = `السلام عليكم، أدعوك للانضمام لمجموعتنا "${currentGroup?.name}" في رفقة الإنجاز لمتابعة الختمات والأوراد.\nرمز الدعوة: ${inviteCode}`;
    if (navigator.share) {
      navigator.share({
        title: `دعوة للانضمام إلى مجموعة "${currentGroup?.name}"`,
        text: textMsg,
        url: inviteUrl,
      }).catch(() => {});
    } else {
      handleCopyFullMessage();
    }
  };

  if (!currentGroup) return null;

  return (
    <div className="space-y-6 pb-20">
      
      {/* Group Card Header */}
      <div className="bg-white rounded-3xl border border-stone-200 p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                {currentGroup.isDemo ? 'مجموعة تجريبية' : 'مجموعة خاصة'}
              </span>
              <span className="text-xs text-stone-400">
                أُنشئت: {formatDateInAden(currentGroup.createdAt)}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-stone-900">{currentGroup.name}</h2>
            {currentGroup.description && (
              <p className="text-xs text-stone-600 leading-relaxed max-w-xl">{currentGroup.description}</p>
            )}
          </div>

          {/* Invitation Box */}
          <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-200/80 flex flex-col items-center sm:items-end gap-1.5 shrink-0">
            <span className="text-[11px] text-emerald-900 font-bold">دعوة الرفاق للانضمام:</span>
            <div className="flex items-center gap-1.5">
              <span className="px-3 py-1 bg-white border border-emerald-300 rounded-xl font-mono text-xs font-bold text-emerald-950 tracking-wider">
                {inviteCode}
              </span>
              <button
                onClick={handleCopyInvite}
                title="نسخ الرمز فقط"
                className="p-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={handleShareInvite}
                title="مشاركة أو إرسال الدعوة"
                className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold transition"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <button
              onClick={handleCopyFullMessage}
              className="text-[10px] text-emerald-800 hover:text-emerald-950 font-bold underline transition mt-0.5"
            >
              {copiedLink ? '✅ تم نسخ رسالة الواتساب!' : '📋 نسخ رسالة دعوة كاملة للواتساب'}
            </button>
          </div>
        </div>

        {/* Admin assignment guidance callout */}
        <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 text-xs text-stone-700 space-y-1">
          <span className="font-bold text-emerald-900 flex items-center gap-1.5 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>كيف يتم تكليف العضو الجديد بالورد؟</span>
          </span>
          <p className="text-[11px] text-stone-600 leading-relaxed">
            1. بمجرد أن يفتح العضو رابط الدعوة ينضم تلقائياً إلى المجموعة.<br />
            2. <strong>تلقائياً:</strong> في بداية كل دورة أو ختمة جديدة، يوزع التطبيق الأجزاء الـ 30 بالتساوي آلياً على جميع الأعضاء.<br />
            3. <strong>يدوياً:</strong> بصفتك مشرفاً، يمكنك في أي وقت فتح <strong>"تفاصيل المهمة"</strong> والضغط على قائمة العضو بجانب أي جزء لاختيار من يقرؤه مباشرة.
          </p>
        </div>

        {/* Navigation Tabs inside Group */}
        <div className="flex items-center gap-2 border-t border-stone-100 pt-3">
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'members'
                ? 'bg-emerald-800 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>الأعضاء ({members.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'activity'
                ? 'bg-emerald-800 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>سجل النشاط ({activityFeed.length})</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Members List */}
      {activeTab === 'members' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                قائمة المشاركين في المجموعة
              </h3>
              <span className="text-xs text-stone-500">
                {members.length} عضو مشارك
              </span>
            </div>

            <button
              onClick={() => setAddDependentModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl text-xs font-bold transition shadow-2xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ إضافة ابن / تابع (بدون هاتف)</span>
            </button>
          </div>

          <div className="divide-y divide-stone-100">
            {members.map(member => {
              const isAdmin = member.role === 'admin' || member.userId === currentGroup.createdBy;
              const isMe = member.userId === currentUser?.uid;
              const isMyChild = member.parentUserId === currentUser?.uid;

              return (
                <div key={member.userId} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center text-sm font-bold text-stone-700">
                      {member.avatar || member.displayName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-stone-900">{member.displayName}</span>
                        {isMe && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-200 text-stone-700 font-semibold">أنت</span>
                        )}
                        {member.isDependent && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-bold flex items-center gap-1">
                            <span>{member.avatar || '👦'}</span>
                            <span>{isMyChild ? 'ابنك التابع' : `تابع لـ: ${member.parentDisplayName || 'ولي الأمر'}`}</span>
                          </span>
                        )}
                        {isAdmin && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-amber-700" />
                            مشرف
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-stone-400">
                        انضم: {formatDateInAden(member.joinedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Member Controls (Available for current admin or parent of dependent) */}
                  <div className="flex items-center gap-1">
                    {/* If dependent of current user or admin */}
                    {member.isDependent && (isMyChild || isCurrentUserAdmin) && (
                      <button
                        onClick={() => {
                          setConfirmDialog({
                            title: 'إزالة التابع من المجموعة',
                            message: `هل أنت متأكد من إزالة التابع "${member.displayName}" من المجموعة؟`,
                            onConfirm: async () => {
                              await removeDependentFromGroup(currentGroup.id, member.userId);
                              showToast(`تمت إزالة ${member.displayName} من المجموعة`, 'info');
                              setConfirmDialog(null);
                            }
                          });
                        }}
                        className="px-2 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-[11px] font-semibold border border-rose-200 transition flex items-center gap-1"
                        title="إزالة التابع من المجموعة"
                      >
                        <Trash2 className="w-3 h-3 text-rose-500" />
                        <span className="hidden sm:inline">إزالة التابع</span>
                      </button>
                    )}

                    {isCurrentUserAdmin && !isMe && !member.isDependent && (
                      <>
                        {isAdmin ? (
                          member.userId !== currentGroup.createdBy && (
                            <button
                              onClick={() => {
                                updateMemberRole(member.userId, 'member');
                                showToast(`تمت إعادة رتبة ${member.displayName} إلى عضو عادي`, 'info');
                              }}
                              className="px-2 py-1 text-amber-700 hover:bg-amber-50 rounded-lg text-[11px] font-bold border border-amber-200 transition flex items-center gap-1"
                              title="إلغاء صلاحية الإشراف"
                            >
                              <Shield className="w-3 h-3 text-amber-600" />
                              <span className="hidden sm:inline">إلغاء الإشراف</span>
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => {
                              updateMemberRole(member.userId, 'admin');
                              showToast(`تمت ترقية ${member.displayName} إلى مشرف بنجاح!`, 'success');
                            }}
                            className="px-2 py-1 text-emerald-800 hover:bg-emerald-50 rounded-lg text-[11px] font-bold border border-emerald-300 transition flex items-center gap-1"
                            title="ترقية هذا العضو إلى مشرف ليساعدك في إدارة المجموعة"
                          >
                            <ShieldCheck className="w-3 h-3 text-emerald-700" />
                            <span className="hidden sm:inline">ترقية لمشرف</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setConfirmDialog({
                              title: 'إزالة العضو',
                              message: `هل أنت متأكد من إزالة "${member.displayName}"؟ سيتم حفظ إنجازاته السابقة بالكامل.`,
                              onConfirm: async () => {
                                await removeMember(member.userId);
                                showToast(`تمت إزالة ${member.displayName} من المجموعة`, 'info');
                                setConfirmDialog(null);
                              }
                            });
                          }}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold transition"
                          title="إزالة من المجموعة مع حفظ تاريخ الإنجاز"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Guide: Admin & Members & Tasks FAQ */}
          <div className="mt-6 pt-5 border-t border-stone-100">
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-right transition hover:bg-amber-50"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-800 shrink-0" />
                <span className="text-xs font-bold text-amber-950">
                  دليل الإشراف ودعوة الرفاق وتوزيع الأوراد القرآنية
                </span>
              </div>
              {showGuide ? <ChevronUp className="w-4 h-4 text-amber-800" /> : <ChevronDown className="w-4 h-4 text-amber-800" />}
            </button>

            {showGuide && (
              <div className="mt-3 p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3.5 text-xs text-stone-700">
                <div className="space-y-1">
                  <h4 className="font-bold text-stone-900 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    كيف أكون مشرفاً في المجموعة؟
                  </h4>
                  <p className="text-[11px] text-stone-600 leading-relaxed pr-3">
                    بمجرد ضغطك على <strong>"إنشاء مجموعة جديدة"</strong>، تصبح تلقائياً المشرف الأساسي والمسؤول عن تلك المجموعة. كما يمكن لأي مشرف حالي ترقية أي عضو آخر ليصبح مشرفاً إضافياً في المجموعة.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-stone-900 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    هل يمكن أن يكون في المجموعة أكثر من مشرف؟
                  </h4>
                  <p className="text-[11px] text-stone-600 leading-relaxed pr-3">
                    <strong>نعم بالتأكيد!</strong> يمكن للمجموعة أن تضم عدة مشرفين، وكل مشرف يستطيع إضافة المهام، وتعديل إسناد الأجزاء القرآنية، وتدوير الختمات عند اكتمالها. يمكنك ترقية أي عضو بالضغط على زر <strong>"ترقية لمشرف"</strong> بجانب اسمه أعلاه.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-stone-900 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    هل يمكن أن أكون مشرفاً لمجموعتي وعضواً في مجموعة أخرى؟
                  </h4>
                  <p className="text-[11px] text-stone-600 leading-relaxed pr-3">
                    <strong>نعم بكل تأكيد!</strong> الصلاحيات مستقلة لكل مجموعة على حدة؛ يمكنك أن تنشئ مجموعتك الخاصة فتكون فيها <strong>مشرفاً</strong>، وفي نفس الوقت تنضم عبر رمز دعوة لمجموعة أخرى أنشأها صديقك فتكون فيها <strong>عضواً عادياً</strong>. ويمكنك التبديل بين مجموعاتك بنقرة واحدة من القائمة العلوية.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-stone-900 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    كيف يدخل المشترك الآخر، وكيف أكلفه بورده القرآني؟
                  </h4>
                  <ol className="list-decimal list-inside text-[11px] text-stone-600 leading-relaxed pr-3 space-y-1">
                    <li>
                      <strong>دعوة المشترك:</strong> اضغط على <strong>"مشاركة الدعوة عبر واتساب"</strong> أو انسخ <strong>رمز الدعوة ({inviteCode})</strong> وأرسله له.
                    </li>
                    <li>
                      <strong>انضمامه:</strong> يقوم المشترك بفتح الرابط أو الضغط على <strong>"الانضمام لمجموعة"</strong> وكتابة الرمز، ليصبح فوراً ضمن قائمة الأعضاء.
                    </li>
                    <li>
                      <strong>تكليفه بالورد القرآني:</strong> افتح <strong>الرئيسية</strong> &larr; اضغط على بطاقة الختمة لتفتح لك تفاصيل الأجزاء (30 جزءاً). ستجد أمام كل جزء قائمة منسدلة لاختيار العضو وتعيين جزئه يدوياً، أو يمكنك الضغط على <strong>"معاينة وتوزيع الأوراد"</strong> لتوزيع الأجزاء الـ 30 على جميع الأعضاء تلقائياً بالتساوي وبنقرة واحدة.
                    </li>
                    <li>
                      <strong>تجربة ذلك فوراً:</strong> يمكنك الضغط على <strong>"تبديل الحساب التجريبي"</strong> في الشريط العلوي والتنقل بين الحسابات لترى كيف تظهر الشاشة للمشترك الآخر وكي يؤكد قراءة جزئه!
                    </li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Activity Feed */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-800" />
              <span>سجل النشاط والإنجاز المباشر:</span>
            </h3>
            <span className="text-[11px] text-stone-400">تحديث فوري</span>
          </div>

          {activityFeed.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-500">
              لا توجد أنشطة مسجلة بعد. عند إتمام أو تدوير المهام ستظهر هنا.
            </div>
          ) : (
            <div className="space-y-2.5">
              {activityFeed.map(act => (
                <div key={act.id} className="p-3 rounded-2xl bg-stone-50 border border-stone-100 flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <p className="font-medium text-stone-800 leading-relaxed">
                      {act.description}
                    </p>
                    <span className="text-[10px] text-stone-400">
                      بواسطة: {act.actorName}
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-400 whitespace-nowrap shrink-0">
                    {formatDateTimeInAden(act.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Admin Danger Zone */}
      {isCurrentUserAdmin && (
        <div className="p-4 rounded-2xl bg-red-50/60 border border-red-200/80 flex items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-red-900 block">إدارة المجموعة من المشرف:</span>
            <span className="text-[11px] text-red-700">يمكنك حذف هذه المجموعة عند الرغبة في إنهائها تماماً.</span>
          </div>
          <button
            onClick={() => {
              setConfirmDialog({
                title: 'حذف المجموعة نهائياً',
                message: 'هل تريد بالتأكيد حذف هذه المجموعة نهائياً؟ لا يمكن التراجع عن هذا الإجراء.',
                onConfirm: async () => {
                  await deleteGroup(currentGroup.id);
                  setConfirmDialog(null);
                }
              });
            }}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition shadow-xs flex items-center gap-1 shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>حذف المجموعة</span>
          </button>
        </div>
      )}

      {/* Add Dependent Modal */}
      {addDependentModalOpen && (
        <AddDependentModal
          onClose={() => setAddDependentModalOpen(false)}
          groupId={currentGroup.id}
        />
      )}

      {/* In-App Confirmation Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 md:p-6 w-full max-w-md shadow-2xl border border-stone-200 space-y-4 animate-fadeIn">
            <h3 className="text-base font-bold text-stone-900">{confirmDialog.title}</h3>
            <p className="text-xs text-stone-600 leading-relaxed">{confirmDialog.message}</p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50 transition"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-xs"
              >
                تأكيد
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
