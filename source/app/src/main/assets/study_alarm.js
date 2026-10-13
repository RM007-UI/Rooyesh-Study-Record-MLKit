(function(){
'use strict';
var $=function(id){return document.getElementById(id);};
var downloadUrl='https://github.com/RM007-UI/Rooyesh-Study-Record-MLKit/releases/latest/download/Rooyesh.apk';
var sourceUrl='https://github.com/RM007-UI/Rooyesh-Study-Record-MLKit';
var style=document.createElement('style');
style.textContent='.study-alarm-field{display:block;margin:10px 0;font-size:13px;line-height:2;color:var(--ink)}.study-alarm-field .input{display:block;width:100%;margin-top:4px}.study-alarm-field input[type=range]{display:block;width:100%;accent-color:var(--green);margin:6px 0}.study-alarm-field output{float:left;color:var(--green);font-variant-numeric:tabular-nums}.study-alarm-check{display:flex;align-items:center;gap:8px;font-size:13px;margin:12px 0}.study-alarm-check input{accent-color:var(--green);width:17px;height:17px}.study-alarm-actions{display:flex;flex-wrap:wrap;gap:8px}.study-alarm-actions .btn{flex:1 1 110px}.settings-note{overflow-wrap:anywhere}';
document.head.appendChild(style);
function status(message){var el=$('studyAlarmStatus');if(el)el.textContent=message;}
function updateVolumeLabel(){var slider=$('studyAlarmVolume'),out=$('studyAlarmVolumeValue');if(slider&&out)out.textContent=slider.value+'٪';}
function refreshFromNative(){
 try{
  if(!window.RooyeshNative||!window.RooyeshNative.getStudyAlarmConfig)return;
  var cfg=JSON.parse(window.RooyeshNative.getStudyAlarmConfig());
  if(!cfg)return;
  if($('studyAlarmTime'))$('studyAlarmTime').value=cfg.time||'08:00';
  if($('studyAlarmRepeat'))$('studyAlarmRepeat').checked=cfg.repeatDaily!==false;
  if($('studyAlarmVolume'))$('studyAlarmVolume').value=String(cfg.volume||100);
  updateVolumeLabel();
  if(cfg.enabled){
   status(cfg.exactPermission?'زنگ ذخیره شده؛ هر روز سر ساعت پخش می‌شه.':'زنگ ذخیره شده؛ برای دقیق زنگ خوردن، اجازهٔ «آلارم‌ها و یادآوری‌ها» رو هم فعال کن.');
  }else{
   status('هنوز زنگی تنظیم نشده.');
  }
 }catch(e){}
}
function openUrl(url,nativeMethod){
 try{
  if(window.RooyeshNative&&typeof window.RooyeshNative[nativeMethod]==='function'){
   window.RooyeshNative[nativeMethod]();
   return;
  }
 }catch(e){}
 try{window.open(url,'_blank');}catch(e){window.location.href=url;}
}
function saveAlarm(){
 var time=$('studyAlarmTime')?$('studyAlarmTime').value:'08:00';
 var repeat=!!($('studyAlarmRepeat')&&$('studyAlarmRepeat').checked);
 var volume=$('studyAlarmVolume')?Number($('studyAlarmVolume').value):100;
 try{
  if(!window.RooyeshNative||typeof window.RooyeshNative.scheduleStudyAlarm!=='function'){
   status('تنظیم زنگ واقعی روی گوشی فقط در نسخهٔ اندروید رویش فعاله.');
   return;
  }
  var result=window.RooyeshNative.scheduleStudyAlarm(time,repeat,volume);
  if(result==='scheduled'){
   status(repeat?'ذخیره شد! هر روز ساعت '+time+' زنگ می‌زنه.':'ذخیره شد! یک‌بار ساعت '+time+' زنگ می‌زنه.');
  }else if(result==='permission_required'){
   status('زمان زنگ ذخیره شد. اجازهٔ «آلارم‌ها و یادآوری‌ها» رو در صفحه‌ای که باز شد فعال کن، بعد برگرد.');
  }else{
   status(result==='invalid'?'زمان واردشده معتبر نیست.':'ذخیره نشد؛ دوباره امتحان کن.');
  }
 }catch(e){status('ذخیره نشد؛ یه بار دیگه امتحان کن.');}
}
function previewAlarm(){
 var volume=$('studyAlarmVolume')?Number($('studyAlarmVolume').value):100;
 try{
  if(window.RooyeshNative&&typeof window.RooyeshNative.previewStudyAlarm==='function'){
   window.RooyeshNative.previewStudyAlarm(volume);
   status('پیش‌نمایش زنگ پخش می‌شه و خودش بعد از چند ثانیه قطع می‌شه.');
   return;
  }
 }catch(e){}
 status('پیش‌نمایش صدا فقط در نسخهٔ اندروید فعاله.');
}
function cancelAlarm(){
 try{
  if(window.RooyeshNative&&typeof window.RooyeshNative.cancelStudyAlarm==='function'){
   window.RooyeshNative.cancelStudyAlarm();
   status('زنگ خاموش شد؛ هر وقت خواستی دوباره تنظیمش کن.');
   return;
  }
 }catch(e){}
 status('خاموش‌کردن زنگ در نسخهٔ اندروید در دسترسه.');
}
function bind(){
 var el=$('studyAlarmVolume');if(el)el.addEventListener('input',updateVolumeLabel);
 el=$('studyAlarmSave');if(el)el.addEventListener('click',saveAlarm);
 el=$('studyAlarmPreview');if(el)el.addEventListener('click',previewAlarm);
 el=$('studyAlarmCancel');if(el)el.addEventListener('click',cancelAlarm);
 el=$('githubUpdateBtn');if(el)el.addEventListener('click',function(){openUrl(downloadUrl,'openGitHubUpdates');});
 el=$('githubSourceBtn');if(el)el.addEventListener('click',function(){openUrl(sourceUrl,'openGitHubSource');});
 refreshFromNative();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
window.RooyeshAlarmUI={onResume:refreshFromNative,refresh:refreshFromNative};
})();