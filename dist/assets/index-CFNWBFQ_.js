(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=[`top`,`right`,`bottom`,`left`],t={top:`bottom`,right:`left`,bottom:`top`,left:`right`};function n(e,t,n){let r=[`block-start`,`block-end`,`inline-start`,`inline-end`].find(t=>e===t||e.startsWith(`${t}-`)),a=r?e.slice(r.length+1):``,o=a===`start`||a===`end`?a:`center`,s=n.startsWith(`vertical`),c=n===`vertical-rl`,l=t===`rtl`,u,d=o;return r?(s?(u=r===`block-start`?c?`right`:`left`:r===`block-end`?c?`left`:`right`:r===`inline-start`?l?`bottom`:`top`:l?`top`:`bottom`,o!==`center`&&(u===`top`||u===`bottom`?c:l)&&(d=o===`start`?`end`:`start`)):(u=r===`block-start`?`top`:r===`block-end`?`bottom`:r===`inline-start`?t===`rtl`?`right`:`left`:t===`rtl`?`left`:`right`,(u===`top`||u===`bottom`)&&t===`rtl`&&o!==`center`&&(d=o===`start`?`end`:`start`)),i(u,d)):`bottom-start`}function r(t,n){let[i,a]=t.split(`-`);return{side:e.includes(i)?i:r(n,`bottom-start`).side,alignment:a===`start`||a===`end`?a:`center`}}function i(e,t){return t===`center`?e:`${e}-${t}`}function a(e,t,n){return Math.max(0,-e)+Math.max(0,e+t-n)}function o(e,t,n,r,i){let a={start:e.left,center:e.left+(e.width-t.width)/2,end:e.right-t.width},o={start:e.top,center:e.top+(e.height-t.height)/2,end:e.bottom-t.height};return n===`top`?{top:e.top-t.height-i,left:a[r]}:n===`bottom`?{top:e.bottom+i,left:a[r]}:n===`left`?{top:o[r],left:e.left-t.width-i}:{top:o[r],left:e.right+i}}function s(e,t,n,r){return r===`top`||r===`bottom`?a(e.top,t.height,n.height):a(e.left,t.width,n.width)}function c(e,t,n,r){return r===`top`||r===`bottom`?a(e.left,t.width,n.width):a(e.top,t.height,n.height)}function l(e,t){return e.reduce((e,n)=>t(n)<t(e)?n:e)}function u({anchor:e,surface:n,viewport:a,preferredPlacement:u,previousPlacement:d,offset:f}){let p=r(u,`bottom-start`),m=d?r(d,`bottom-start`):null,h=m?.side??p.side,g=[h,t[h]],_=t=>s(o(e,n,t,p.alignment,f),n,a,t),v=m&&_(h)===0?h:l(g,_),y=m?.alignment??p.alignment,b=y===`center`?[`center`,`start`,`end`]:[y,y===`start`?`end`:`start`],x=t=>c(o(e,n,v,t,f),n,a,v),S=m&&x(y)===0?y:l(b,x);return{...o(e,n,v,S,f),side:v,placement:i(v,S)}}function d(e,t){if(e===void 0||e.trim()===``)return t;let n=Number(e);return Number.isFinite(n)&&n>=0?n:t}var f=class{previousPlacement=null;preferredPlacement=``;anchor;surface;getPlacement;getOffset;defaultOffset;constructor(e,t,n,r,i=5){this.anchor=e,this.surface=t,this.getPlacement=n,this.getOffset=r,this.defaultOffset=i}observe(e){window.addEventListener(`resize`,this.position,{signal:e}),window.addEventListener(`scroll`,this.position,{capture:!0,signal:e})}reset(){this.previousPlacement=null,this.preferredPlacement=``}position=()=>{let e=getComputedStyle(this.anchor),t=n(this.getPlacement(),e.direction,e.writingMode);t!==this.preferredPlacement&&(this.previousPlacement=null,this.preferredPlacement=t);let r=this.anchor.getBoundingClientRect(),i=u({anchor:r,surface:{width:this.surface.offsetWidth,height:this.surface.offsetHeight},viewport:{width:window.innerWidth,height:window.innerHeight},preferredPlacement:t,previousPlacement:this.previousPlacement,offset:d(this.getOffset(),this.defaultOffset)});this.previousPlacement=i.placement,this.surface.style.left=`${i.left}px`,this.surface.style.top=`${i.top}px`,this.surface.setAttribute(`data-sds-side`,i.side);let a=Math.min(Math.max(r.left+r.width/2-i.left,12),Math.max(12,this.surface.offsetWidth-12)),o=Math.min(Math.max(r.top+r.height/2-i.top,12),Math.max(12,this.surface.offsetHeight-12));this.surface.style.setProperty(`--sds-floating-arrow-x`,`${a}px`),this.surface.style.setProperty(`--sds-floating-arrow-y`,`${o}px`)}},p=class{anchor;surface;positioner;closeDelay;focusOpenDelay;hoverOpenDelay;openTimer=null;closeTimer=null;pointerInside=!1;constructor(e,t,n,r={}){this.anchor=e,this.surface=t,this.positioner=n,this.closeDelay=r.closeDelay??120,this.focusOpenDelay=r.focusOpenDelay??0,this.hoverOpenDelay=r.hoverOpenDelay??0}observe(e){this.anchor.addEventListener(`pointerenter`,this.handlePointerEnter,{signal:e}),this.anchor.addEventListener(`pointerleave`,this.handlePointerLeave,{signal:e}),this.anchor.addEventListener(`focusin`,this.handleFocusIn,{signal:e}),this.anchor.addEventListener(`focusout`,this.handleFocusOut,{signal:e}),this.surface.addEventListener(`pointerenter`,this.handlePointerEnter,{signal:e}),this.surface.addEventListener(`pointerleave`,this.handlePointerLeave,{signal:e}),this.surface.addEventListener(`focusin`,this.handleFocusIn,{signal:e}),this.surface.addEventListener(`focusout`,this.handleFocusOut,{signal:e}),this.surface.addEventListener(`beforetoggle`,this.handleBeforeToggle,{signal:e}),this.surface.addEventListener(`toggle`,this.handleToggle,{signal:e}),document.addEventListener(`keydown`,this.handleKeydown,{signal:e})}disconnect(){this.clearTimers()}isOpen(){return this.surface.matches(`:popover-open`)}clearTimers(){this.openTimer!==null&&clearTimeout(this.openTimer),this.closeTimer!==null&&clearTimeout(this.closeTimer),this.openTimer=null,this.closeTimer=null}show(){this.openTimer=null,!this.isOpen()&&(this.positioner.reset(),this.surface.showPopover(),this.positioner.position())}scheduleOpen(e){if(this.closeTimer!==null&&clearTimeout(this.closeTimer),this.closeTimer=null,!(this.isOpen()||this.openTimer!==null)){if(e===0){this.show();return}this.openTimer=setTimeout(()=>this.show(),e)}}scheduleClose(){this.openTimer!==null&&clearTimeout(this.openTimer),this.openTimer=null,this.isOpen()&&this.closeTimer===null&&(this.closeTimer=setTimeout(()=>{this.closeTimer=null;let e=document.activeElement;!this.pointerInside&&!this.anchor.contains(e)&&!this.surface.contains(e)&&this.surface.hidePopover()},this.closeDelay))}handlePointerEnter=()=>{this.pointerInside=!0,this.scheduleOpen(this.hoverOpenDelay)};handlePointerLeave=()=>{this.pointerInside=!1,this.scheduleClose()};handleFocusIn=()=>{this.scheduleOpen(this.focusOpenDelay)};handleFocusOut=()=>{this.scheduleClose()};handleBeforeToggle=e=>{e.newState===`open`&&this.positioner.reset()};handleToggle=()=>{this.isOpen()?this.positioner.position():this.positioner.reset()};handleKeydown=e=>{e.key===`Escape`&&this.isOpen()&&(e.preventDefault(),this.clearTimers(),this.surface.hidePopover())}},m=0;function h(e,t){if(e.id)return e.id;let n;do m+=1,n=`${t}-${m}`;while(document.getElementById(n));return e.id=n,n}function g(e){return Array.from(e.children).filter(e=>e instanceof HTMLElement)}function _(e){e.hasAttribute(`type`)||(e.type=`button`)}function v(e,t,n){e.toggleAttribute(t,n)}function y(e,t,n){e.setAttribute(t,n)}function b(e,t,n){let r=e.getAttribute(t);if(r===null||r.trim()===``)return n;let i=Number(r);return Number.isFinite(i)&&i>=0?i:n}function x(e,t,n){if(!Number.isFinite(n)||n<0)throw RangeError(`${t} must be a nonnegative finite number.`);e.setAttribute(t,String(n))}var S=class{controller=null;observer=null;connect(e,t,n){return this.disconnect(),this.controller=new AbortController,this.observer=new MutationObserver(t),this.observer.observe(e,n),this.controller.signal}disconnect(){this.controller?.abort(),this.observer?.disconnect(),this.controller=null,this.observer=null}};function C(e,t){if(typeof customElements>`u`)return;let n=customElements.get(e);if(n&&n!==t)throw Error(`Cannot register ${e}: another constructor already uses that name.`);n||customElements.define(e,t)}var w=typeof HTMLElement>`u`?class{}:HTMLElement,T=class extends w{input=null;list=null;emptyStatus=null;options=[];activeOption=null;suppressOpen=!1;matchQuery=null;selecting=!1;connection=new S;optionObserver=null;inputObserver=null;positioner=null;emptyPositioner=null;connectedCallback(){this.positioner=null,this.emptyPositioner=null,this.optionObserver?.disconnect(),this.inputObserver?.disconnect(),this.input=null,this.list=null,this.emptyStatus=null,this.options=[],this.activeOption=null,this.suppressOpen=!1,this.matchQuery=null;let e=this.connection.connect(this,()=>this.connectedCallback(),{childList:!0}),t=g(this),n=t.find(e=>e instanceof HTMLInputElement&&(e.type===`text`||e.type===`search`)),r=t.find(e=>e instanceof HTMLUListElement),i=t.find(e=>e instanceof HTMLOutputElement);if(!n||!r||t.length!==(i?3:2)||g(r).some(e=>!(e instanceof HTMLLIElement))){console.warn(`<sds-combobox> requires a direct child text or search input, a direct child ul with li options, and optionally one output for empty results.`);return}!n.labels?.length&&!n.hasAttribute(`aria-label`)&&!n.hasAttribute(`aria-labelledby`)&&console.warn(`<sds-combobox> requires an accessible name on its input.`),h(n,`sds-combobox-input`);let a=h(r,`sds-combobox-list`);n.setAttribute(`role`,`combobox`),n.setAttribute(`aria-autocomplete`,`list`),n.setAttribute(`aria-controls`,a),n.setAttribute(`aria-expanded`,`false`),n.removeAttribute(`aria-activedescendant`),r.classList.add(`sds-combobox-list`),r.setAttribute(`role`,`listbox`),r.setAttribute(`popover`,`manual`),r.hidden=!0,this.input=n,this.list=r,this.emptyStatus=i??null,this.positioner=new f(n,r,()=>`block-end-start`,()=>void 0),i&&(this.emptyPositioner=new f(n,i,()=>`block-end-start`,()=>void 0)),this.refreshOptions(),n.addEventListener(`focus`,this.handleFocus,{signal:e}),n.addEventListener(`input`,this.handleInput,{signal:e}),n.addEventListener(`compositionend`,this.handleCompositionEnd,{signal:e}),n.addEventListener(`keydown`,this.handleKeydown,{signal:e}),n.addEventListener(`blur`,this.handleBlur,{signal:e}),r.addEventListener(`mousedown`,this.handleMouseDown,{signal:e}),r.addEventListener(`click`,this.handleClick,{signal:e}),n.form?.addEventListener(`reset`,this.handleFormReset,{signal:e}),window.addEventListener(`resize`,this.handleReposition,{signal:e}),window.addEventListener(`scroll`,this.handleReposition,{capture:!0,signal:e}),this.optionObserver=new MutationObserver(()=>{this.refreshOptions(),!this.suppressOpen&&document.activeElement===this.input&&this.updateMatches()}),this.optionObserver.observe(r,{childList:!0,subtree:!0,characterData:!0,attributes:!0,attributeFilter:[`aria-disabled`,`aria-busy`]}),this.inputObserver=new MutationObserver(()=>{(n.disabled||n.readOnly)&&(this.close(),this.clearEmptyStatus())}),this.inputObserver.observe(n,{attributes:!0,attributeFilter:[`disabled`,`readonly`]})}disconnectedCallback(){this.close(),this.clearEmptyStatus(),this.connection.disconnect(),this.optionObserver?.disconnect(),this.inputObserver?.disconnect(),this.optionObserver=null,this.inputObserver=null,this.input=null,this.list=null,this.emptyStatus=null,this.positioner=null,this.emptyPositioner=null,this.options=[],this.activeOption=null,this.suppressOpen=!1,this.matchQuery=null}refreshOptions(){if(this.list){this.options=g(this.list).filter(e=>e instanceof HTMLLIElement);for(let e of this.options)h(e,`sds-combobox-option`),e.setAttribute(`role`,`option`),e.hasAttribute(`aria-selected`)||e.setAttribute(`aria-selected`,`false`);this.activeOption&&!this.options.includes(this.activeOption)&&this.setActive(null)}}selectableOptions(){return this.options.filter(e=>!e.hidden&&e.getAttribute(`aria-disabled`)!==`true`)}setActive(e){this.activeOption&&this.activeOption!==e&&this.activeOption.setAttribute(`aria-selected`,`false`),this.activeOption=e,e?(e.setAttribute(`aria-selected`,`true`),this.input?.setAttribute(`aria-activedescendant`,e.id),e.scrollIntoView?.({block:`nearest`})):this.input?.removeAttribute(`aria-activedescendant`)}close(){this.list&&this.input&&(this.list.matches(`:popover-open`)&&this.list.hidePopover(),this.list.hidden=!0,this.input.setAttribute(`aria-expanded`,`false`),this.setActive(null))}clearEmptyStatus(){this.emptyStatus&&(this.emptyStatus.textContent=``),this.emptyPositioner?.reset()}updateEmptyStatus(){if(!this.emptyStatus||!this.input||!this.list)return;let e=!this.suppressOpen&&!this.input.disabled&&!this.input.readOnly&&document.activeElement===this.input&&this.input.value.trim()!==``&&this.list.getAttribute(`aria-busy`)!==`true`&&this.options.every(e=>e.hidden)?this.emptyStatus.getAttribute(`data-empty-message`)?.trim()||`No results found.`:``;if(!e){this.clearEmptyStatus();return}this.emptyStatus.textContent!==e&&(this.emptyStatus.textContent=e),this.emptyStatus.style.minWidth=`${this.input.getBoundingClientRect().width}px`,this.emptyPositioner?.position()}updateMatches(){if(this.input&&this.list){if(this.getAttribute(`filter`)!==`manual`){let e=(this.matchQuery??this.input.value).trim().toLocaleLowerCase();for(let t of this.options)t.hidden=!t.textContent?.toLocaleLowerCase().includes(e)}if(this.emptyStatus&&queueMicrotask(()=>this.updateEmptyStatus()),this.activeOption&&!this.selectableOptions().includes(this.activeOption)&&this.setActive(null),!(!this.suppressOpen&&!this.input.disabled&&!this.input.readOnly&&this.selectableOptions().length>0&&document.activeElement===this.input)){this.close();return}this.list.style.minWidth=`${this.input.getBoundingClientRect().width}px`,this.list.matches(`:popover-open`)||(this.list.hidden=!1,this.positioner?.reset(),this.list.showPopover()),this.positioner?.position(),this.input.setAttribute(`aria-expanded`,`true`)}}select(e){if(!this.input||this.input.disabled||this.input.readOnly||!this.selectableOptions().includes(e))return;let t=e.getAttribute(`data-label`);if(t!==null&&!t.trim()){console.warn(`<sds-combobox> option data-label must be nonempty.`);return}let n=t?.trim()??e.textContent?.trim()??``,r=e.getAttribute(`data-sds-value`)??n,i=this.hasAttribute(`keep-open`);i&&(this.matchQuery??=this.input.value),this.input.value=n,i?this.setActive(null):(this.suppressOpen=!0,this.close()),this.selecting=!0;try{this.input.focus(),this.input.dispatchEvent(new Event(`input`,{bubbles:!0})),this.input.dispatchEvent(new Event(`change`,{bubbles:!0})),this.dispatchEvent(new CustomEvent(`sds-select`,{bubbles:!0,composed:!0,detail:{option:e,value:r}}))}finally{this.selecting=!1}i&&(this.refreshOptions(),this.updateMatches())}handleFocus=()=>{this.selecting||(this.suppressOpen=!1,this.matchQuery=null,this.refreshOptions(),this.updateMatches())};handleInput=e=>{this.selecting||e instanceof InputEvent&&e.isComposing||(this.suppressOpen=!1,this.matchQuery=null,this.refreshOptions(),this.setActive(null),this.updateMatches())};handleCompositionEnd=()=>{this.suppressOpen=!1,this.matchQuery=null,this.refreshOptions(),this.updateMatches()};handleKeydown=e=>{if(e.isComposing||!this.input||!this.list||this.input.disabled||this.input.readOnly)return;if(e.key===`Escape`){(!this.list.hidden||this.emptyStatus?.textContent)&&(e.preventDefault(),this.suppressOpen=!0,this.close(),this.clearEmptyStatus());return}if(e.key===`Enter`&&!this.list.hidden&&this.activeOption){e.preventDefault(),this.select(this.activeOption);return}if(e.key!==`ArrowDown`&&e.key!==`ArrowUp`)return;this.suppressOpen=!1,this.refreshOptions(),this.list.hidden&&this.updateMatches();let t=this.selectableOptions();if(!t.length)return;e.preventDefault();let n=this.activeOption?t.indexOf(this.activeOption):-1;this.setActive(t[e.key===`ArrowDown`?(n+1)%t.length:n<0?t.length-1:(n-1+t.length)%t.length])};handleFormReset=()=>{this.suppressOpen=!0,this.matchQuery=null,this.close(),this.clearEmptyStatus()};handleReposition=()=>{this.list?.matches(`:popover-open`)&&this.positioner?.position(),this.emptyStatus?.textContent&&this.emptyPositioner?.position()};handleBlur=()=>{this.close(),this.clearEmptyStatus()};handleMouseDown=e=>{e.target instanceof Element&&this.list?.contains(e.target.closest(`[role="option"]`))&&e.preventDefault()};handleClick=e=>{if(!(e.target instanceof Element))return;let t=e.target.closest(`[role="option"]`);t&&this.list?.contains(t)&&this.select(t)}};function E(){C(`sds-combobox`,T)}var D=!1,ee=6,O=48,te=12,ne=80,re=180,k=null,A=new WeakMap,j=new WeakMap;function ie(e){let t=e.getAttribute(`commandfor`);if(t){let e=document.getElementById(t);return e instanceof HTMLDialogElement&&e.matches(`.sds-dialog, .sds-panel`)?e:null}return e.closest(`dialog.sds-dialog, dialog.sds-panel`)}function ae(e,t){e.open||(t?e.showModal():e.show())}function oe(e){let t=e.dataset.sdsSide;return t===`bottom`||t===`left`?t:`right`}function se(e,t){return t===`bottom`?e.clientY:t===`left`?-e.clientX:e.clientX}function ce(e,t){return t===`bottom`?e.clientX:e.clientY}function le(e,t){let n=e.getBoundingClientRect();return t===`bottom`?n.height:n.width}function M(e,t){return e===`bottom`?`translate3d(0, ${t}px, 0)`:`translate3d(${e===`left`?-t:t}px, 0, 0)`}function N(e){A.get(e)?.();let t=j.get(e);if(!t)return;let n=Array.from(e.children).find(e=>e.classList.contains(`_sds-panel-handle`));n instanceof HTMLElement&&(n.style.cursor=t.handleCursor),e.style.transform=t.transform,e.style.transitionDuration=t.transitionDuration,e.style.transitionTimingFunction=t.transitionTimingFunction,e.style.setProperty(`--sds-panel-backdrop-opacity`,t.backdropOpacity),j.delete(e)}function ue(e){e.frame=null;let t=le(e.panel,e.side),n=Math.min(e.distance,t),r=t>0?n/t:0;e.panel.style.transform=M(e.side,n),e.panel.style.setProperty(`--sds-panel-backdrop-opacity`,String(1-r))}function de(e,t){let{panel:n}=e,r=n.ownerDocument.defaultView;if(!r){N(n);return}n.style.transitionDuration=`var(--sds-duration-normal)`,n.style.transitionTimingFunction=t===`close`?`var(--sds-easing-exit)`:`var(--sds-easing-enter)`;let i=()=>{r.clearTimeout(s),n.removeEventListener(`transitionend`,o),A.delete(n)},a=()=>{i(),t===`close`&&n.open&&n.close(),N(n)},o=e=>{e.target===n&&e.propertyName===`transform`&&a()},s=r.setTimeout(a,250);if(A.set(n,i),n.addEventListener(`transitionend`,o),t===`close`){let t=le(n,e.side);n.style.transform=M(e.side,t),n.style.setProperty(`--sds-panel-backdrop-opacity`,`0`)}else n.style.transform=M(e.side,0),n.style.setProperty(`--sds-panel-backdrop-opacity`,`1`)}function fe(e){e.handle.hasPointerCapture(e.pointerId)&&e.handle.releasePointerCapture(e.pointerId)}function pe(e){if(!e.isPrimary||e.button!==0||!(e.target instanceof Element))return;let t=e.target.closest(`._sds-panel-handle`),n=t?.closest(`dialog.sds-panel[open]`),r=n&&A.get(n);if(!t||!n||t.parentElement!==n||j.has(n)&&!r)return;let i=oe(n),a=0;if(r){let e=new DOMMatrixReadOnly(n.ownerDocument.defaultView?.getComputedStyle(n).transform);a=Math.max(0,i===`bottom`?e.m42:i===`left`?-e.m41:e.m41),r(),n.style.transitionDuration=`0s`,n.style.transform=M(i,a),t.style.cursor=`grabbing`}else j.set(n,{backdropOpacity:n.style.getPropertyValue(`--sds-panel-backdrop-opacity`),handleCursor:t.style.cursor,transform:n.style.transform,transitionDuration:n.style.transitionDuration,transitionTimingFunction:n.style.transitionTimingFunction});k={dismissal:`pending`,distance:a,dragging:!!r,frame:null,handle:t,lastTime:e.timeStamp,panel:n,pointerId:e.pointerId,samples:[{distance:a,time:e.timeStamp}],side:i,startCrossCoordinate:ce(e,i),startCoordinate:se(e,i)-a},t.setPointerCapture(e.pointerId)}function me(e){let t=k;if(!t||e.pointerId!==t.pointerId)return;let n=Math.max(0,se(e,t.side)-t.startCoordinate),r=Math.abs(ce(e,t.side)-t.startCrossCoordinate);if(!t.dragging){if(n<ee||n<r*1.15)return;t.dragging=!0,t.panel.style.transitionDuration=`0s`,t.handle.style.cursor=`grabbing`}if(e.preventDefault(),n!==t.distance){let r=e.timeStamp,i=r-ne,a=t.samples.findIndex(e=>e.time>=i);if(a<0)t.samples=[{distance:t.distance,time:i}];else if(a>0){let e=t.samples[a-1],n=t.samples[a],r=(i-e.time)/(n.time-e.time);t.samples=t.samples.slice(a),t.samples.unshift({distance:e.distance+(n.distance-e.distance)*r,time:i})}t.samples.push({distance:n,time:r}),t.samples=t.samples.slice(-8),t.lastTime=r}t.distance=n,n>=O?t.dismissal=`committed`:n<=te&&t.dismissal===`committed`&&(t.dismissal=`cancelled`),t.frame===null&&(t.frame=t.panel.ownerDocument.defaultView?.requestAnimationFrame(()=>ue(t))??null)}function P(e,t){let n=k;if(!n||e.pointerId!==n.pointerId)return;if(t||me(e),k=null,fe(n),!n.dragging){N(n.panel);return}let r=n.panel.ownerDocument.defaultView;n.frame!==null&&r&&(r.cancelAnimationFrame(n.frame),ue(n));let i=n.samples[0],a=n.samples[n.samples.length-1],o=n.samples.some(e=>e.distance-n.distance>ee),s=e.timeStamp-n.lastTime>ne||o?0:Math.max(0,(a.distance-i.distance)/Math.max(1,a.time-i.time)),c=n.distance+s*re;if(!(!t&&n.distance>0&&(n.dismissal===`committed`||n.dismissal===`pending`&&c>=O))){de(n,`open`);return}let l=n.panel.ownerDocument.defaultView?.Event;de(n,l&&n.panel.dispatchEvent(new l(`cancel`,{cancelable:!0}))?`close`:`open`)}function F(e){if(Array.from(e.children).find(e=>e.classList.contains(`_sds-panel-handle`)))return;let t=e.ownerDocument.createElement(`div`);t.className=`_sds-panel-handle`,t.setAttribute(`aria-hidden`,`true`),e.prepend(t)}function I(e){e instanceof HTMLDialogElement&&e.matches(`.sds-panel`)&&F(e);for(let t of e.querySelectorAll(`dialog.sds-panel`))F(t)}function he(e){if(!(e.target instanceof Element))return;let t=e.target.closest(`[commandfor], dialog.sds-dialog [command], dialog.sds-panel [command]`);if(t){let n=ie(t);if(!n)return;let r=t.getAttribute(`command`);if((r===`show-modal`||r===`close`||r===`request-close`)&&e.preventDefault(),r===`show-modal`)ae(n,!0);else if(r===`close`)n.close(t.getAttribute(`data-sds-return-value`)??``);else if(r===`request-close`){let e=Reflect.get(n,`requestClose`);if(typeof e==`function`)e.call(n,t.getAttribute(`data-sds-return-value`)??``);else{let e=new Event(`cancel`,{cancelable:!0});n.dispatchEvent(e)&&n.close(t.getAttribute(`data-sds-return-value`)??``)}}return}let n=e.target.closest(`dialog.sds-dialog[open], dialog.sds-panel[open]`);if(!n||e.target!==n)return;let r=n.getBoundingClientRect();(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)&&n.getAttribute(`closedby`)===`any`&&n.close()}function ge(){if(D||typeof document>`u`)return;D=!0,document.addEventListener(`click`,he),document.addEventListener(`pointerdown`,pe),document.addEventListener(`pointermove`,me),document.addEventListener(`pointerup`,e=>P(e,!1)),document.addEventListener(`pointercancel`,e=>P(e,!0)),document.addEventListener(`lostpointercapture`,e=>P(e,!0)),document.addEventListener(`close`,e=>{if(e.target instanceof HTMLDialogElement&&e.target.matches(`.sds-panel`)){if(k?.panel===e.target){fe(k);let t=e.target.ownerDocument.defaultView;k.frame!==null&&t&&t.cancelAnimationFrame(k.frame),k=null}N(e.target)}},!0),I(document);let e=document.defaultView?.MutationObserver;e&&new e(e=>{for(let t of e){t.type===`attributes`&&t.target instanceof HTMLDialogElement&&t.target.matches(`.sds-panel`)&&F(t.target);for(let e of t.addedNodes)e instanceof Element&&I(e)}}).observe(document.documentElement,{attributeFilter:[`class`],attributes:!0,childList:!0,subtree:!0})}var _e=typeof HTMLElement>`u`?class{}:HTMLElement,ve=class extends _e{static observedAttributes=[`open`,`placement`,`offset`];trigger=null;menu=null;items=[];positioner=null;connection=new S;get open(){return this.hasAttribute(`open`)}set open(e){v(this,`open`,e)}get placement(){return this.getAttribute(`placement`)??`block-end-start`}set placement(e){y(this,`placement`,e)}get offset(){return b(this,`offset`,5)}set offset(e){x(this,`offset`,e)}get width(){return this.getAttribute(`width`)??`md`}set width(e){y(this,`width`,e)}get hideCaret(){return this.hasAttribute(`hide-caret`)}set hideCaret(e){v(this,`hide-caret`,e)}connectedCallback(){this.positioner=null,this.trigger=null,this.menu=null,this.items=[];let e=this.connection.connect(this,()=>this.connectedCallback(),{childList:!0}),t=g(this),n=t.find(e=>e instanceof HTMLButtonElement),r=n?.getAttribute(`popovertarget`),i=t.filter(e=>e!==n),a=t.find(e=>e.id===r)??i.find(e=>e.matches(`menu, [popover], .sds-dropdown-menu`))??(i.length===1?i[0]:null)??null;if(!n||!a){console.warn(`<sds-dropdown> requires one direct child button and one direct child menu or popover.`);return}_(n);let o=h(a,`sds-dropdown`);a.classList.add(`sds-dropdown-menu`),a.setAttribute(`popover`,a.getAttribute(`popover`)||`auto`),n.setAttribute(`popovertarget`,o),n.setAttribute(`aria-controls`,o),n.setAttribute(`aria-expanded`,String(a.matches(`:popover-open`))),n.hasAttribute(`aria-haspopup`)||n.setAttribute(`aria-haspopup`,`menu`),a.setAttribute(`role`,`menu`),a.hasAttribute(`aria-orientation`)||a.setAttribute(`aria-orientation`,`vertical`),this.trigger=n,this.menu=a,this.positioner=new f(n,a,()=>this.placement,()=>this.getAttribute(`offset`)??void 0),this.collectItems(),n.addEventListener(`keydown`,this.handleTriggerKeydown,{signal:e}),a.addEventListener(`beforetoggle`,this.handleBeforeToggle,{signal:e}),a.addEventListener(`toggle`,this.handleToggle,{signal:e}),a.addEventListener(`keydown`,this.handleMenuKeydown,{signal:e}),a.addEventListener(`click`,this.handleMenuClick,{signal:e}),this.positioner.observe(e),this.open&&this.show()}disconnectedCallback(){this.connection.disconnect(),this.positioner=null,this.trigger=null,this.menu=null,this.items=[]}attributeChangedCallback(e,t,n){if(t!==n&&this.isConnected){if(e===`open`){n===null?this.hide():this.show();return}this.isSurfaceOpen()&&(this.positioner?.reset(),this.positioner?.position())}}show(){if(!this.menu){this.open=!0;return}this.isSurfaceOpen()||(this.collectItems(),this.positioner?.reset(),this.menu.showPopover(),this.positioner?.position())}hide(){if(!this.menu){this.open=!1;return}this.isSurfaceOpen()&&this.menu.hidePopover()}isSurfaceOpen(){return this.menu?.matches(`:popover-open`)??!1}collectItems(){if(!this.menu){this.items=[];return}for(let e of this.menu.querySelectorAll(`:scope > li`))e.hasAttribute(`role`)||e.setAttribute(`role`,`none`);this.items=Array.from(this.menu.querySelectorAll(`button, a[href], [role="menuitem"]`)).filter(e=>!e.closest(`[role="menuitem"] [role="menuitem"]`)).map(e=>(e.setAttribute(`role`,`menuitem`),e.tabIndex=-1,e)).filter(e=>!(e instanceof HTMLButtonElement)||!e.disabled)}showAndFocus(e=0){this.show(),this.items[e]?.focus()}hideAndRestoreFocus(){this.hide(),this.trigger?.focus()}handleToggle=()=>{let e=this.isSurfaceOpen();v(this,`open`,e),e?this.positioner?.position():this.positioner?.reset(),this.dispatchEvent(new CustomEvent(`sds-toggle`,{bubbles:!0,composed:!0,detail:{open:e}}))};handleBeforeToggle=e=>{e.newState===`open`&&(this.collectItems(),this.positioner?.reset()),this.trigger?.setAttribute(`aria-expanded`,String(e.newState===`open`))};handleTriggerKeydown=e=>{let t=e.key===`ArrowUp`?this.items.length-1:0;(e.key===`ArrowDown`||e.key===`ArrowUp`||e.key===`Enter`||e.key===` `)&&(e.preventDefault(),this.isSurfaceOpen()?this.items[t]?.focus():this.showAndFocus(t))};handleMenuKeydown=e=>{this.collectItems();let t=this.items.findIndex(e=>e===document.activeElement),n=null;if(e.key===`ArrowDown`)n=(t+1)%this.items.length;else if(e.key===`ArrowUp`)n=(t-1+this.items.length)%this.items.length;else if(e.key===`Home`)n=0;else if(e.key===`End`)n=this.items.length-1;else if(e.key===`Escape`){e.preventDefault(),this.hideAndRestoreFocus();return}n!==null&&this.items.length!==0&&(e.preventDefault(),this.items[n].focus())};handleMenuClick=e=>{if(!(e.target instanceof Element))return;let t=e.target.closest(`[role="menuitem"]`);if(t){if(t.getAttribute(`aria-disabled`)===`true`||t instanceof HTMLButtonElement&&t.disabled){e.preventDefault();return}this.hide()}}};function ye(){C(`sds-dropdown`,ve)}var be=typeof HTMLElement>`u`?class{}:HTMLElement,xe=class extends be{static observedAttributes=[`open`,`placement`,`offset`];content=null;positioner=null;hoverController=null;connection=new S;get open(){return this.hasAttribute(`open`)}set open(e){v(this,`open`,e)}get placement(){return this.getAttribute(`placement`)??`block-end-start`}set placement(e){y(this,`placement`,e)}get offset(){return b(this,`offset`,9)}set offset(e){x(this,`offset`,e)}get width(){return this.getAttribute(`width`)??`md`}set width(e){y(this,`width`,e)}connectedCallback(){this.hoverController?.disconnect(),this.hoverController=null,this.positioner=null,this.content=null;let e=this.connection.connect(this,()=>this.connectedCallback(),{childList:!0}),t=g(this),n=t.find(e=>e instanceof HTMLButtonElement),r=n?.getAttribute(`popovertarget`),i=t.filter(e=>e!==n),a=t.find(e=>e.id===r)??i.find(e=>e.matches(`[popover], .sds-popover-content`))??(i.length===1?i[0]:null)??null;if(!n||!a){console.warn(`<sds-popover> requires one direct child button and one direct child content element.`);return}_(n);let o=h(a,`sds-popover`);a.classList.add(`sds-popover-content`),a.setAttribute(`popover`,a.getAttribute(`popover`)||`auto`),n.setAttribute(`popovertarget`,o),this.content=a,this.positioner=new f(n,a,()=>this.placement,()=>this.getAttribute(`offset`)??void 0,9),this.hoverController=new p(n,a,this.positioner,{focusOpenDelay:500,hoverOpenDelay:500}),this.hoverController.observe(e),this.positioner.observe(e),a.addEventListener(`toggle`,this.handleToggle,{signal:e}),this.open&&this.show()}disconnectedCallback(){this.connection.disconnect(),this.hoverController?.disconnect(),this.hoverController=null,this.positioner=null,this.content=null}attributeChangedCallback(e,t,n){if(t!==n&&this.isConnected){if(e===`open`){n===null?this.hide():this.show();return}this.content?.matches(`:popover-open`)&&(this.positioner?.reset(),this.positioner?.position())}}show(){if(!this.content){this.open=!0;return}this.content.matches(`:popover-open`)||this.content.showPopover()}hide(){if(!this.content){this.open=!1;return}this.content.matches(`:popover-open`)&&this.content.hidePopover()}handleToggle=()=>{let e=this.content?.matches(`:popover-open`)??!1;v(this,`open`,e),this.dispatchEvent(new CustomEvent(`sds-toggle`,{bubbles:!0,composed:!0,detail:{open:e}}))}};function Se(){C(`sds-popover`,xe)}var L=!1,R=new WeakMap;function z(e){let t=R.get(e);t!==void 0&&window.clearTimeout(t),R.delete(e),e.removeAttribute(`sds-closing`)}function Ce(){L||typeof document>`u`||(L=!0,document.addEventListener(`beforetoggle`,e=>{if(!(e instanceof ToggleEvent)||e.oldState!==`open`||e.newState!==`closed`||!(e.target instanceof HTMLElement)||!e.target.matches(`.sds-sidebar[popover]`))return;let t=e.target;z(t),t.setAttribute(`sds-closing`,``),R.set(t,window.setTimeout(()=>z(t),500))},!0),document.addEventListener(`transitionend`,e=>{e.propertyName===`transform`&&e.target instanceof HTMLElement&&e.target.matches(`.sds-sidebar[sds-closing]`)&&z(e.target)},!0))}var we=`sds-change`,Te=typeof HTMLElement>`u`?class{}:HTMLElement,Ee=class extends Te{static observedAttributes=[`value`,`orientation`];tabs=[];panels=new Map;connection=new S;reflectingValue=!1;get value(){return this.getAttribute(`value`)??``}set value(e){if(this.isConnected&&!this.tabs.some(t=>this.tabValue(t)===e&&!this.isDisabled(t)))throw RangeError(`<sds-tabs> has no enabled tab with value "${e}".`);y(this,`value`,e)}get activation(){return this.getAttribute(`activation`)??`automatic`}set activation(e){y(this,`activation`,e)}get orientation(){return this.getAttribute(`orientation`)??`horizontal`}set orientation(e){y(this,`orientation`,e)}get size(){return this.getAttribute(`size`)??`md`}set size(e){y(this,`size`,e)}get tone(){return this.getAttribute(`tone`)??`info`}set tone(e){y(this,`tone`,e)}get variant(){return this.getAttribute(`variant`)??`folder`}set variant(e){y(this,`variant`,e)}connectedCallback(){let e=this.connection.connect(this,()=>this.connectedCallback(),{childList:!0,subtree:!0}),t=g(this),n=t.find(e=>e.matches(`.sds-tab-list, [role="tablist"]`))??t[0]??null;if(this.tabs=n?g(n).filter(e=>e instanceof HTMLButtonElement||e instanceof HTMLAnchorElement):[],this.panels.clear(),!n||this.tabs.length===0){console.warn(`<sds-tabs> requires a tab-list container with button or link children.`);return}let r=t.filter(e=>e!==n);if(r.length<this.tabs.length){console.warn(`<sds-tabs> requires one panel for every tab.`);return}n.classList.add(`sds-tab-list`),n.setAttribute(`role`,`tablist`),this.hasAttribute(`orientation`)&&this.syncOrientation(n),!n.hasAttribute(`aria-label`)&&!n.hasAttribute(`aria-labelledby`)&&console.warn(`<sds-tabs> requires an accessible name on its tab list.`);let i=new Set(r);for(let[e,t]of this.tabs.entries()){t instanceof HTMLButtonElement&&_(t);let n=t.getAttribute(`aria-controls`),a=r.find(e=>e.id===n)??null,o=a&&i.has(a)?a:r[e]&&i.has(r[e])?r[e]:i.values().next().value;if(!o)continue;i.delete(o);let s=h(t,`sds-tab`),c=h(o,`sds-tab-panel`);t.classList.add(`sds-tab`),t.setAttribute(`role`,`tab`),t.setAttribute(`aria-controls`,c),o.classList.add(`sds-tab-panel`),o.setAttribute(`role`,`tabpanel`),o.setAttribute(`aria-labelledby`,s),this.panels.set(t,o)}let a=this.value?this.tabs.find(e=>this.tabValue(e)===this.value&&!this.isDisabled(e)):null;this.value&&!a&&console.warn(`<sds-tabs> has no enabled tab with value "${this.value}".`);let o=a??this.tabs.find(e=>e.getAttribute(`aria-selected`)===`true`&&!this.isDisabled(e))??this.tabs.find(e=>!this.isDisabled(e))??null;for(let e of this.tabs){let t=e===o;e.setAttribute(`aria-selected`,String(t)),e.tabIndex=t?0:-1;let n=this.panels.get(e);n&&(n.hidden=!t)}o&&this.reflectValue(this.tabValue(o)),n.addEventListener(`click`,this.handleClick,{signal:e}),n.addEventListener(`keydown`,this.handleKeydown,{signal:e})}disconnectedCallback(){this.connection.disconnect()}attributeChangedCallback(e,t,n){if(t===n)return;if(e===`orientation`){this.syncOrientation();return}if(!this.isConnected||e!==`value`||this.reflectingValue||n===null)return;let r=this.tabs.findIndex(e=>this.tabValue(e)===n&&!this.isDisabled(e));if(r>=0){this.select(r,!1,!1);return}console.warn(`<sds-tabs> has no enabled tab with value "${n}".`);let i=this.tabs.find(e=>e.getAttribute(`aria-selected`)===`true`);i&&this.reflectValue(this.tabValue(i))}isDisabled(e){return e instanceof HTMLButtonElement&&e.disabled||e.getAttribute(`aria-disabled`)===`true`}syncOrientation(e){(e??g(this).find(e=>e.matches(`.sds-tab-list, [role="tablist"]`)))?.setAttribute(`aria-orientation`,this.orientation)}tabValue(e){return e.getAttribute(`value`)??e.id}reflectValue(e){this.reflectingValue=!0,y(this,`value`,e),this.reflectingValue=!1}select(e,t=!1,n=!0){let r=this.tabs[e],i=this.panels.get(r);if(!r||!i||this.isDisabled(r))return;let a=this.tabs.findIndex(e=>e.getAttribute(`aria-selected`)===`true`);this.tabs.forEach(e=>{let t=e===r;e.setAttribute(`aria-selected`,String(t)),e.tabIndex=t?0:-1;let n=this.panels.get(e);n&&(n.hidden=!t)}),this.reflectValue(this.tabValue(r)),t&&r.focus(),n&&a!==e&&this.dispatchEvent(new CustomEvent(we,{bubbles:!0,composed:!0,detail:{index:e,value:this.tabValue(r)}}))}handleClick=e=>{if(!(e.target instanceof Element))return;let t=e.target.closest(`.sds-tab[role="tab"]`),n=t?this.tabs.indexOf(t):-1;n<0||t instanceof HTMLAnchorElement||this.select(n)};handleKeydown=e=>{if(!(document.activeElement instanceof HTMLElement))return;let t=this.tabs.indexOf(document.activeElement);if(t<0)return;let n=e.currentTarget;if(!(n instanceof HTMLElement))return;let r=this.orientation===`vertical`||n.getAttribute(`aria-orientation`)===`vertical`,i=window.getComputedStyle(n).direction===`rtl`,a=r?`ArrowDown`:i?`ArrowLeft`:`ArrowRight`,o=r?`ArrowUp`:i?`ArrowRight`:`ArrowLeft`,s=this.tabs.filter(e=>!this.isDisabled(e));if(s.length===0)return;let c=s.indexOf(this.tabs[t]),l=null;if(e.key===a?l=s[(c+1)%s.length]:e.key===o?l=s[(c-1+s.length)%s.length]:e.key===`Home`?l=s[0]:e.key===`End`&&(l=s[s.length-1]),!l)return;e.preventDefault();let u=this.tabs.indexOf(l);this.activation===`manual`||l instanceof HTMLAnchorElement?l.focus():this.select(u,!0)}};function De(){C(`sds-tabs`,Ee)}var Oe=typeof HTMLElement>`u`?class{}:HTMLElement,ke=class extends Oe{static observedAttributes=[`placement`,`offset`,`size`];content=null;positioner=null;hoverController=null;connection=new S;get placement(){return this.getAttribute(`placement`)??`block-start`}set placement(e){y(this,`placement`,e)}get offset(){return b(this,`offset`,6)}set offset(e){x(this,`offset`,e)}get size(){return this.getAttribute(`size`)??`sm`}set size(e){y(this,`size`,e)}connectedCallback(){this.hoverController?.disconnect(),this.hoverController=null,this.positioner=null,this.content=null;let e=this.connection.connect(this,()=>this.connectedCallback(),{childList:!0}),t=g(this),n=t.find(e=>e.matches(`[role="tooltip"], .sds-tooltip-content, [popover]`))??(t.length===2?t[1]:null)??null,r=t.find(e=>e!==n)??null;if(!r||!n){console.warn(`<sds-tooltip> requires one direct child trigger and one direct child text element.`);return}let i=h(n,`sds-tooltip`),a=new Set((r.getAttribute(`aria-describedby`)??``).split(/\s+/).filter(Boolean));a.add(i),n.classList.add(`sds-tooltip-content`),n.setAttribute(`role`,`tooltip`),n.setAttribute(`popover`,`manual`),r.setAttribute(`aria-describedby`,[...a].join(` `)),this.content=n,this.positioner=new f(r,n,()=>this.placement,()=>this.getAttribute(`offset`)??void 0,6),this.hoverController=new p(r,n,this.positioner,{closeDelay:0,hoverOpenDelay:0}),this.hoverController.observe(e),this.positioner.observe(e)}disconnectedCallback(){this.connection.disconnect(),this.hoverController?.disconnect(),this.hoverController=null,this.positioner=null,this.content=null}attributeChangedCallback(e,t,n){t!==n&&this.isConnected&&this.content?.matches(`:popover-open`)&&(this.positioner?.reset(),this.positioner?.position())}};function Ae(){C(`sds-tooltip`,ke)}var B=5e3,je=typeof HTMLElement>`u`?class{}:HTMLElement,V=class extends je{static observedAttributes=[`open`,`duration`,`persistent`];hideTimer=null;get open(){return this.hasAttribute(`open`)}set open(e){v(this,`open`,e)}get tone(){return this.getAttribute(`tone`)??`info`}set tone(e){y(this,`tone`,e)}get duration(){let e=b(this,`duration`,B);return e>0?e:B}set duration(e){if(!Number.isFinite(e)||e<=0)throw RangeError(`duration must be a positive finite number.`);x(this,`duration`,e)}get persistent(){return this.hasAttribute(`persistent`)}set persistent(e){v(this,`persistent`,e)}connectedCallback(){window.getComputedStyle(this).display,this.setAttribute(`sds-ready`,``),this.hasAttribute(`role`)||this.setAttribute(`role`,`status`),this.hasAttribute(`aria-atomic`)||this.setAttribute(`aria-atomic`,`true`),this.addEventListener(`click`,this.handleClick),this.addEventListener(`focusin`,this.pauseAutoHide),this.addEventListener(`focusout`,this.handleFocusOut),this.addEventListener(`pointerenter`,this.pauseAutoHide),this.addEventListener(`pointerleave`,this.resumeAutoHide),this.open&&this.scheduleAutoHide()}disconnectedCallback(){this.clearAutoHide(),this.removeEventListener(`click`,this.handleClick),this.removeEventListener(`focusin`,this.pauseAutoHide),this.removeEventListener(`focusout`,this.handleFocusOut),this.removeEventListener(`pointerenter`,this.pauseAutoHide),this.removeEventListener(`pointerleave`,this.resumeAutoHide)}attributeChangedCallback(e,t,n){t!==n&&this.isConnected&&(e===`open`&&n===null?this.clearAutoHide():this.open&&this.scheduleAutoHide())}show(){if(this.open){this.scheduleAutoHide();return}this.open=!0,this.dispatchEvent(new CustomEvent(`sds-open`,{bubbles:!0,composed:!0}))}close(e=`programmatic`){this.open&&(this.open=!1,this.dispatchEvent(new CustomEvent(`sds-close`,{bubbles:!0,composed:!0,detail:{reason:e}})))}scheduleAutoHide(){this.clearAutoHide(),this.open&&!this.persistent&&(this.hideTimer=window.setTimeout(()=>this.close(`timeout`),this.duration))}clearAutoHide(){this.hideTimer!==null&&(window.clearTimeout(this.hideTimer),this.hideTimer=null)}handleClick=e=>{e.target instanceof Element&&e.target.closest(`[data-sds-toast-close]`)&&this.close(`dismiss`)};pauseAutoHide=()=>{this.clearAutoHide()};resumeAutoHide=()=>{!this.matches(`:hover`)&&!this.contains(document.activeElement)&&this.scheduleAutoHide()};handleFocusOut=e=>{(!(e.relatedTarget instanceof Node)||!this.contains(e.relatedTarget))&&this.resumeAutoHide()}},Me=!1;function Ne(){Me||typeof document>`u`||(Me=!0,document.addEventListener(`click`,e=>{if(!(e.target instanceof Element))return;let t=e.target.closest(`[data-sds-toast-open]`)?.getAttribute(`data-sds-toast-open`),n=t?document.getElementById(t):null;n instanceof V&&n.show()}))}function Pe(){C(`sds-toast`,V),Ne()}function Fe(){E(),ge(),ye(),Se(),Ce(),De(),Pe(),Ae()}var Ie=new WeakSet;function Le(){let e=document.querySelector(`#selection-example`);if(!e)throw Error(`Missing selection example form.`);if(Ie.has(e))return;let t=e.querySelector(`[role="status"]`);for(let n of e.querySelectorAll(`button[aria-pressed]`))n.addEventListener(`click`,()=>{let e=n.getAttribute(`aria-pressed`)!==`true`;n.setAttribute(`aria-pressed`,String(e)),t.textContent=`${n.textContent.trim()}: ${e?`on`:`off`}.`});e.addEventListener(`reset`,n=>setTimeout(()=>{if(!n.defaultPrevented){for(let t of e.querySelectorAll(`button[aria-pressed]`))t.setAttribute(`aria-pressed`,`false`);t.textContent=`Initial choices restored.`}},0)),e.addEventListener(`submit`,n=>{n.preventDefault(),t.textContent=`Submitted choices: ${JSON.stringify([...new FormData(e)])}`}),Ie.add(e)}typeof document<`u`&&document.querySelector(`#selection-example`)&&Le();var Re=new WeakSet;function ze(){let e=document.querySelector(`#table-selection-example`);if(!e)throw Error(`Missing table selection example form.`);if(Re.has(e))return;let t=e.querySelector(`input[type="search"]`),n=e.querySelector(`[data-assignee-filter]`),r=e.querySelector(`[data-status-filter]`),i=e.querySelector(`[data-page-size]`),a=e.querySelector(`[data-select-all]`),o=e.querySelector(`.sds-table-selection`),s=e.querySelector(`[data-table-status]`),c=e.querySelector(`[data-table-announcement]`),l=e.querySelector(`tbody`),u=e.querySelector(`.sds-pagination ul`),d=e.querySelector(`dialog`),f=null,p=new Set,m=[`Implement responsive navigation`,`Refactor authentication module`,`Optimize image loading`,`Add accessibility features`,`Integrate third-party API`,`Update user profile page`,`Fix mobile layout issues`,`Implement dark mode`,`Set up CI/CD pipeline`,`Improve form validation`,`Review keyboard navigation`,`Document component patterns`,`Add project search`,`Update notification preferences`,`Improve empty states`,`Test file upload errors`,`Review table pagination`,`Add account settings`,`Audit color contrast`,`Update onboarding flow`,`Improve loading feedback`,`Review error messages`,`Test date range filters`,`Document deployment process`,`Prepare release checklist`],h=[`Jamie Carter`,`Morgan Lee`,`Riley Thompson`,``,`Casey Martinez`,`Jordan Kim`,`Alex Patel`,`Samira Hassan`,`Chris Walker`,`Jamie Carter`],g=m.map((e,t)=>({id:`SDS-${101+t}`,description:e,assignee:h[t%h.length],status:[`open`,`submitted`,`approved`][t%3]})),_=g.map(e=>({...e})),v=1,y=`all`,b=!0,x=[];function S(e,t=``,n=``){let r=document.createElement(e);return r.className=t,r.textContent=n,r}function C(){let e=t.value.trim().toLocaleLowerCase();return _.filter(t=>`${t.id} ${t.description} ${t.assignee||`Unassigned`} ${t.status}`.toLocaleLowerCase().includes(e)&&(y!==`mine`||t.assignee===`Jamie Carter`)&&(y!==`unassigned`||!t.assignee)&&(n.value===`all`||t.assignee===n.value)&&(r.value===`all`||t.status===r.value)).sort((e,t)=>e.id.localeCompare(t.id)*(b?1:-1))}function w(){a.checked=x.length>0&&p.size===x.length,a.indeterminate=p.size>0&&p.size<x.length,a.disabled=x.length===0,o.hidden=p.size===0,e.querySelector(`[data-selected-count]`).textContent=`${p.size} selected`;for(let e of l.querySelectorAll(`input[type="checkbox"]`))e.checked=p.has(e.value);let t=C().length,n=t?(v-1)*Number(i.value)+1:0,r=n?n+x.length-1:0;s.textContent=`Showing ${n}-${r} of ${t}${p.size?`. ${p.size} selected`:``}`}function T(){let n=C(),r=Number(i.value),a=Math.max(1,Math.ceil(n.length/r));v=Math.min(v,a),x=n.slice((v-1)*r,v*r);let o=new Set(x.map(e=>e.id));for(let e of p)o.has(e)||p.delete(e);if(l.replaceChildren(...x.map(n=>{let r=document.createElement(`tr`),i=S(`td`),a=S(`input`,`sds-checkbox`);a.type=`checkbox`,a.name=`task[]`,a.value=n.id,a.setAttribute(`aria-label`,`Select ${n.id}`),i.append(a);let o=S(`th`);o.scope=`row`;let s=S(`button`,`sds-button`,n.id);s.type=`button`,s.dataset.sdsVariant=`text`,s.dataset.sdsDensity=`compact`,s.addEventListener(`click`,()=>{d.querySelector(`[data-task-description]`).textContent=`${n.id}: ${n.description}`,d.querySelector(`[data-task-assignee]`).textContent=`Assignee: ${n.assignee||`Unassigned`}`,d.querySelector(`[data-task-status]`).textContent=`Status: ${n.status}`,f=s,d.showModal()}),o.append(s);let l=S(`td`),u=S(`div`,`sds-cluster`);u.dataset.sdsGap=`sm`;let m=S(`span`,`sds-avatar`,n.assignee?n.assignee.split(` `).map(e=>e[0]).join(``):`?`);m.dataset.sdsSize=`sm`,m.setAttribute(`aria-hidden`,`true`),u.append(m,S(`span`,``,n.assignee||`Unassigned`)),l.append(u);let h=S(`td`),g=S(`div`,`sds-stack`);g.dataset.sdsGap=`xs`;let _=S(`span`,`sds-badge`,n.status.toUpperCase());_.dataset.sdsVariant=`light-border`,_.dataset.sdsTone={open:`warning`,submitted:`info`,approved:`success`}[n.status];let v=S(`div`);v.append(_);let y=S(`small`,``,{open:`Open`,submitted:`Testing`,approved:`Recently updated`}[n.status]);g.append(v,y),h.append(g);let b=S(`td`),x=document.createElement(`sds-dropdown`);x.setAttribute(`hide-caret`,``),x.setAttribute(`width`,`sm`);let C=S(`button`,`sds-button`,`⋯`);C.type=`button`,C.dataset.sdsShape=`icon`,C.dataset.taskMenu=n.id,C.setAttribute(`aria-label`,`Actions for ${n.id}`);let w=document.createElement(`menu`);for(let[r,i,a]of[[`Mark approved`,`status`,`approved`],[`Assign to me`,`assignee`,`Jamie Carter`]]){let o=document.createElement(`li`),s=S(`button`,`sds-button`,r);s.type=`button`,s.disabled=n[i]===a,s.addEventListener(`click`,()=>{n[i]=a,p.clear(),T(),(e.querySelector(`[data-task-menu="${n.id}"]`)??t).focus(),c.textContent=`${n.id}: ${r.toLowerCase()}. Changes are local to this example.`}),o.append(s),w.append(o)}return x.append(C,w),b.append(x),r.append(i,o,S(`td`,``,n.description),l,h,b),r})),!x.length){let e=document.createElement(`tr`),t=S(`td`,``,`No tasks match these filters.`);t.colSpan=6,e.append(t),l.append(e)}let s=(e,t,n,r=!1)=>{let i=document.createElement(`li`),a=S(`button`,``,n);if(a.type=`button`,a.disabled=r,a.setAttribute(`aria-label`,e),n===`‹`||n===`›`){let e=document.createElementNS(`http://www.w3.org/2000/svg`,`svg`);e.setAttribute(`viewBox`,`0 0 8 13`),e.setAttribute(`aria-hidden`,`true`);let t=document.createElementNS(`http://www.w3.org/2000/svg`,`path`);t.setAttribute(`d`,n===`‹`?`M7.35 1.13 2.73 6.75l4.62 4.65-1.23 1.23L.87 7.38a.86.86 0 0 1 0-1.23L6.12.9l1.23 1.23Z`:`m.62 1.13 1.23-1.23 5.25 5.25a.86.86 0 0 1 0 1.23l-5.25 5.25-1.23-1.23 4.62-4.65L.62 1.13Z`),e.append(t),a.replaceChildren(e)}return t===v&&/^\d+$/.test(n)&&a.setAttribute(`aria-current`,`page`),a.addEventListener(`click`,()=>{v=t,p.clear(),T(),u.querySelector(`[aria-current="page"]`)?.focus()}),i.append(a),i};u.replaceChildren(s(`Previous task page`,v-1,`‹`,v===1),...Array.from({length:a},(e,t)=>s(`Task page ${t+1}`,t+1,String(t+1))),s(`Next task page`,v+1,`›`,v===a)),e.querySelector(`th[aria-sort]`).setAttribute(`aria-sort`,b?`ascending`:`descending`),w()}function E(){v=1,p.clear(),T()}function D(e){let t=e=>`"${String(e).replace(/^[=+\-@\t\r]/,`'$&`).replaceAll(`"`,`""`)}"`,n=[[`Task`,`Description`,`Assignee`,`Status`],...e.map(e=>[e.id,e.description,e.assignee||`Unassigned`,e.status])].map(e=>e.map(t).join(`,`)).join(`\r
`),r=URL.createObjectURL(new Blob([n],{type:`text/csv;charset=utf-8`})),i=document.createElement(`a`);i.href=r,i.download=`project-tasks.csv`,document.body.append(i),i.click(),i.remove(),setTimeout(()=>URL.revokeObjectURL(r),1e3),c.textContent=`Exported ${e.length} tasks.`}t.addEventListener(`input`,E),n.addEventListener(`change`,E),r.addEventListener(`change`,E),i.addEventListener(`change`,E);for(let t of e.querySelectorAll(`[data-task-scope]`))t.addEventListener(`click`,()=>{y=y===t.dataset.taskScope?`all`:t.dataset.taskScope;for(let t of e.querySelectorAll(`[data-task-scope]`))t.setAttribute(`aria-pressed`,String(t.dataset.taskScope===y));n.value=`all`,E()});a.addEventListener(`change`,()=>{for(let e of x)a.checked?p.add(e.id):p.delete(e.id);w()}),l.addEventListener(`change`,e=>{e.target.matches(`input[type="checkbox"]`)&&(e.target.checked?p.add(e.target.value):p.delete(e.target.value),w())}),e.querySelector(`[data-clear-selection]`).addEventListener(`click`,()=>{p.clear(),w(),a.focus()}),e.querySelector(`[data-bulk-action]`).addEventListener(`click`,()=>{let e=p.size;for(let e of _)p.has(e.id)&&(e.status=`approved`);p.clear(),T(),(a.disabled?t:a).focus(),c.textContent=`${e} tasks marked approved. Changes are local to this example.`});for(let t of e.querySelectorAll(`[data-sort], [data-sort-order]`))t.addEventListener(`click`,()=>{b=!b,E()});e.querySelector(`[data-export-selected]`).addEventListener(`click`,()=>D(_.filter(e=>p.has(e.id)))),e.querySelector(`[data-export-results]`).addEventListener(`click`,()=>D(C())),e.querySelector(`[data-close-task]`).addEventListener(`click`,()=>d.close()),d.addEventListener(`close`,()=>{f?.focus(),f=null}),e.addEventListener(`reset`,n=>setTimeout(()=>{if(!n.defaultPrevented){_=g.map(e=>({...e})),y=`all`,b=!0;for(let t of e.querySelectorAll(`[data-task-scope]`))t.setAttribute(`aria-pressed`,`false`);E(),t.focus(),c.textContent=`Initial tasks and filters restored.`}},0)),e.addEventListener(`submit`,e=>{e.preventDefault(),E()}),T(),Re.add(e)}typeof document<`u`&&document.querySelector(`#table-selection-example`)&&ze();var Be=new WeakSet;function Ve(){let e=document.querySelector(`#multiple-selection-example`);if(!e)throw Error(`Missing multiple selection example form.`);if(Be.has(e))return;let t=e.querySelector(`sds-combobox`),n=t.querySelector(`input`),r=[...t.querySelectorAll(`li`)],i=e.querySelector(`[data-selected-topics]`),a=e.querySelector(`p[role="status"]`),o=[...i.querySelectorAll(`input[type="hidden"]`)].map(e=>e.value),s=new Set(o);function c(){i.replaceChildren();for(let e of r){let t=e.dataset.sdsValue;if(!s.has(t)){e.removeAttribute(`aria-disabled`);continue}e.setAttribute(`aria-disabled`,`true`);let r=document.createElement(`input`);r.type=`hidden`,r.name=`topic`,r.value=t;let o=document.createElement(`button`);o.type=`button`,o.className=`sds-tag`,o.textContent=`${e.textContent.trim()} \u00d7`,o.setAttribute(`aria-label`,`Remove ${e.textContent.trim()}`),o.addEventListener(`click`,()=>{let r=[...i.querySelectorAll(`button`)].indexOf(o);s.delete(t),c();let l=i.querySelectorAll(`button`);(l[Math.min(r,l.length-1)]??n).focus(),a.textContent=`${e.textContent.trim()} removed. ${s.size} selected.`}),i.append(r,o)}n.setCustomValidity(s.size?``:`Choose at least one topic.`)}t.addEventListener(`sds-select`,e=>{s.add(e.detail.value),c(),queueMicrotask(()=>{n.value=``,n.dispatchEvent(new Event(`input`,{bubbles:!0}))}),a.textContent=`${s.size} topics selected.`}),e.addEventListener(`reset`,e=>setTimeout(()=>{e.defaultPrevented||(s.clear(),o.forEach(e=>s.add(e)),c(),n.dispatchEvent(new Event(`input`,{bubbles:!0})),a.textContent=`Initial selections restored.`)},0)),e.addEventListener(`submit`,t=>{t.preventDefault(),a.textContent=`Submitted topic IDs: ${JSON.stringify(new FormData(e).getAll(`topic`))}`}),c(),Be.add(e)}typeof document<`u`&&document.querySelector(`#multiple-selection-example`)&&Ve();var He=new WeakSet;function Ue(){let e=document.querySelector(`#input-actions-example`);if(!e)throw Error(`Missing input actions example form.`);if(He.has(e))return;let t=e.querySelector(`input[type="password"]`),n=e.querySelector(`[data-reveal]`),r=e.querySelector(`input[type="search"]`),i=e.querySelector(`[role="status"]`);n.addEventListener(`click`,()=>{let e=t.type===`password`;t.type=e?`text`:`password`,n.setAttribute(`aria-pressed`,String(e))}),e.querySelector(`[data-clear]`).addEventListener(`click`,()=>{r.value=``,r.dispatchEvent(new Event(`input`,{bubbles:!0})),r.focus(),i.textContent=`Search cleared.`}),e.querySelector(`[data-copy-value]`).addEventListener(`click`,async()=>{try{await navigator.clipboard.writeText(e.querySelector(`input[readonly]`).value),i.textContent=`Project URL copied.`}catch(e){i.textContent=`Copy failed. Select the project URL and copy it manually.`,console.error(`Could not copy the project URL.`,e)}}),e.addEventListener(`reset`,e=>setTimeout(()=>{e.defaultPrevented||(t.type=`password`,n.setAttribute(`aria-pressed`,`false`),i.textContent=``)},0)),e.addEventListener(`submit`,n=>{n.preventDefault(),i.textContent=`Search: ${new FormData(e).get(`query`)}. Password ${t.value?`provided`:`not provided`}.`}),He.add(e)}typeof document<`u`&&document.querySelector(`#input-actions-example`)&&Ue();var We=new WeakSet;function Ge(){let e=document.querySelector(`#date-range-example`);if(!e)throw Error(`Missing date range example form.`);if(We.has(e))return;let t=e.querySelector(`[name="start"]`),n=e.querySelector(`[name="end"]`),r=e.querySelector(`[data-date-error]`),i=e.querySelector(`[role="status"]`);function a(){let e=!!(t.value&&n.value&&n.valueAsNumber<t.valueAsNumber);n.min=t.value,n.setCustomValidity(e?`End date must be on or after start date.`:``),n.setAttribute(`aria-invalid`,String(e)),r.textContent=e?`End date must be on or after start date.`:``}function o(e){return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,`0`)}-${String(e.getDate()).padStart(2,`0`)}`}t.addEventListener(`input`,a),n.addEventListener(`input`,a),e.querySelector(`[data-last-week]`).addEventListener(`click`,()=>{let e=new Date,r=new Date(e.getFullYear(),e.getMonth(),e.getDate()-6);t.value=o(r),n.value=o(e),a(),i.textContent=`Selected the last 7 calendar days, including today.`}),e.addEventListener(`reset`,e=>setTimeout(()=>{e.defaultPrevented||(a(),i.textContent=``)},0)),e.addEventListener(`submit`,t=>{if(t.preventDefault(),a(),!e.reportValidity())return;let n=new FormData(e);i.textContent=`Reporting period: ${n.get(`start`)} through ${n.get(`end`)} (inclusive).`}),a(),We.add(e)}typeof document<`u`&&document.querySelector(`#date-range-example`)&&Ge();var Ke=new WeakSet;function qe(){let e=document.querySelector(`#file-upload-example`);if(!e)throw Error(`Missing file upload example form.`);if(Ke.has(e))return;let t=e.querySelector(`input[type="file"]`),n=e.querySelector(`ul`),r=e.querySelector(`[role="status"]`),i=new Set,a=new Intl.NumberFormat(void 0,{maximumFractionDigits:1});function o(){t.setCustomValidity([...i].some(e=>!e.invalid)?``:`Choose at least one PDF smaller than 10 MB.`)}function s(e){let t=document.activeElement;e.retry.disabled=!!e.request||e.invalid||e.complete,e.cancel.disabled=!e.request,e.retry.hidden=!!e.request||e.invalid||e.complete,e.cancel.hidden=!e.request,(t===e.retry||t===e.cancel)&&t.hidden&&(e.request?e.cancel:e.complete||e.invalid?e.remove:e.retry).focus()}function c(t){if(t.invalid||t.request||t.complete)return;let n=new XMLHttpRequest;t.request=n,t.message.textContent=`Uploading`,t.progress.hidden=!1,t.progress.removeAttribute(`value`),s(t),n.open(`POST`,e.action),n.timeout=6e4,n.upload.addEventListener(`progress`,e=>{e.lengthComputable&&(t.progress.max=e.total,t.progress.value=e.loaded)});function a(e,n=!1){t.request=null,t.complete=n,t.message.textContent=e,t.progress.hidden=!0,t.retry.textContent=`Retry`,t.retry.setAttribute(`aria-label`,`Retry ${t.file.name}`),s(t),i.has(t)&&(r.textContent=`${t.file.name}: ${e}`)}n.addEventListener(`load`,()=>{n.status>=200&&n.status<300?a(`Uploaded`,!0):a(`Upload failed (HTTP ${n.status}). Retry when the server is ready.`)}),n.addEventListener(`error`,()=>a(`Network error. Check your connection and retry.`)),n.addEventListener(`timeout`,()=>a(`Upload timed out. Retry.`)),n.addEventListener(`abort`,()=>a(`Upload cancelled. You can retry.`));let o=new FormData;o.append(`attachment`,t.file,t.file.name),n.send(o)}t.addEventListener(`change`,()=>{for(let e of t.files){if([...i].some(t=>t.file.name===e.name&&t.file.size===e.size&&t.file.lastModified===e.lastModified))continue;let l=document.createElement(`li`);l.className=`sds-file-item`;let u=document.createElementNS(`http://www.w3.org/2000/svg`,`svg`);u.setAttribute(`viewBox`,`0 0 24 24`),u.setAttribute(`aria-hidden`,`true`),u.innerHTML=`<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8Zm0 0v5h5M9 13h6m-6 4h6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`;let d=document.createElement(`div`);d.className=`sds-file-details`;let f=document.createElement(`strong`);f.textContent=e.name;let p=document.createElement(`small`),m=document.createElement(`span`);m.textContent=e.size<1024?`${e.size} B`:e.size<1048576?`${a.format(e.size/1024)} KB`:`${a.format(e.size/1048576)} MB`;let h=document.createElement(`span`),g=document.createElement(`progress`);g.className=`sds-progress`,g.hidden=!0,g.setAttribute(`aria-label`,`Upload progress for ${e.name}`);let _=document.createElement(`div`);_.className=`sds-action-group`;let v=(t,n)=>{let r=document.createElement(`button`);return r.type=`button`,r.className=`sds-button`,r.dataset.sdsVariant=`text`,r.dataset.sdsSize=`sm`,r.textContent=t,r.setAttribute(`aria-label`,`${t} ${e.name}`),r.addEventListener(`click`,n),_.append(r),r},y=e.size>=10485760||!e.name.toLowerCase().endsWith(`.pdf`),b={file:e,invalid:y,complete:!1,request:null,message:h,progress:g,retry:null,cancel:null,remove:null};b.retry=v(`Upload`,()=>c(b)),b.cancel=v(`Cancel`,()=>b.request?.abort()),b.remove=v(`Remove`,()=>{i.delete(b),b.request?.abort(),l.remove(),t.focus(),o(),r.textContent=`${e.name} removed.`}),b.remove.dataset.sdsTone=`danger`,s(b),h.textContent=y?`Choose a PDF smaller than 10 MB.`:`Ready to upload`,p.append(m,h),d.append(f,p,g),l.append(u,d,_),i.add(b),n.append(l)}t.value=``,o(),r.textContent=`${i.size} files listed.`}),e.addEventListener(`formdata`,e=>{e.formData.delete(t.name);for(let n of i)n.invalid||e.formData.append(t.name,n.file,n.file.name)}),e.addEventListener(`submit`,e=>{e.preventDefault();for(let e of i)c(e)}),e.addEventListener(`reset`,e=>setTimeout(()=>{if(e.defaultPrevented)return;let t=[...i];i.clear();for(let e of t)e.request?.abort();n.replaceChildren(),r.textContent=`File queue cleared.`,o()},0)),o(),Ke.add(e)}typeof document<`u`&&document.querySelector(`#file-upload-example`)&&qe();var Je=`const initializedForms = new WeakSet()

export function setupSelectionExample() {
  const form = document.querySelector('#selection-example')
  if (!form) throw new Error('Missing selection example form.')
  if (initializedForms.has(form)) return
  const status = form.querySelector('[role="status"]')
  for (const button of form.querySelectorAll('button[aria-pressed]')) {
    button.addEventListener('click', () => {
      const pressed = button.getAttribute('aria-pressed') !== 'true'
      button.setAttribute('aria-pressed', String(pressed))
      status.textContent = \`\${button.textContent.trim()}: \${pressed ? 'on' : 'off'}.\`
    })
  }
  form.addEventListener('reset', event => setTimeout(() => {
    if (event.defaultPrevented) return
    for (const button of form.querySelectorAll('button[aria-pressed]')) {
      button.setAttribute('aria-pressed', 'false')
    }
    status.textContent = 'Initial choices restored.'
  }, 0))
  form.addEventListener('submit', event => {
    event.preventDefault()
    status.textContent = \`Submitted choices: \${JSON.stringify([...new FormData(form)])}\`
  })
  initializedForms.add(form)
}

if (typeof document !== 'undefined' && document.querySelector('#selection-example')) {
  setupSelectionExample()
}
`,Ye=`const initializedForms = new WeakSet()

export function setupTableSelectionExample() {
  const form = document.querySelector('#table-selection-example')
  if (!form) throw new Error('Missing table selection example form.')
  if (initializedForms.has(form)) return
  const search = form.querySelector('input[type="search"]')
  const assigneeFilter = form.querySelector('[data-assignee-filter]')
  const statusFilter = form.querySelector('[data-status-filter]')
  const pageSize = form.querySelector('[data-page-size]')
  const all = form.querySelector('[data-select-all]')
  const selectionBar = form.querySelector('.sds-table-selection')
  const status = form.querySelector('[data-table-status]')
  const announcement = form.querySelector('[data-table-announcement]')
  const body = form.querySelector('tbody')
  const pagination = form.querySelector('.sds-pagination ul')
  const dialog = form.querySelector('dialog')
  let dialogTrigger = null
  const selected = new Set()
  const descriptions = [
    'Implement responsive navigation', 'Refactor authentication module',
    'Optimize image loading', 'Add accessibility features',
    'Integrate third-party API', 'Update user profile page',
    'Fix mobile layout issues', 'Implement dark mode',
    'Set up CI/CD pipeline', 'Improve form validation',
    'Review keyboard navigation', 'Document component patterns',
    'Add project search', 'Update notification preferences',
    'Improve empty states', 'Test file upload errors',
    'Review table pagination', 'Add account settings',
    'Audit color contrast', 'Update onboarding flow',
    'Improve loading feedback', 'Review error messages',
    'Test date range filters', 'Document deployment process',
    'Prepare release checklist',
  ]
  const people = ['Jamie Carter', 'Morgan Lee', 'Riley Thompson', '', 'Casey Martinez', 'Jordan Kim', 'Alex Patel', 'Samira Hassan', 'Chris Walker', 'Jamie Carter']
  const initial = descriptions.map((description, index) => ({
    id: \`SDS-\${101 + index}\`,
    description,
    assignee: people[index % people.length],
    status: ['open', 'submitted', 'approved'][index % 3],
  }))
  let tasks = initial.map(task => ({ ...task }))
  let pageNumber = 1
  let scope = 'all'
  let ascending = true
  let visible = []

  function node(tag, className = '', text = '') {
    const element = document.createElement(tag)
    element.className = className
    element.textContent = text
    return element
  }

  function filteredTasks() {
    const query = search.value.trim().toLocaleLowerCase()
    return tasks.filter(task =>
      \`\${task.id} \${task.description} \${task.assignee || 'Unassigned'} \${task.status}\`.toLocaleLowerCase().includes(query) &&
      (scope !== 'mine' || task.assignee === 'Jamie Carter') &&
      (scope !== 'unassigned' || !task.assignee) &&
      (assigneeFilter.value === 'all' || task.assignee === assigneeFilter.value) &&
      (statusFilter.value === 'all' || task.status === statusFilter.value),
    ).sort((a, b) => a.id.localeCompare(b.id) * (ascending ? 1 : -1))
  }

  function updateSelection() {
    all.checked = visible.length > 0 && selected.size === visible.length
    all.indeterminate = selected.size > 0 && selected.size < visible.length
    all.disabled = visible.length === 0
    selectionBar.hidden = selected.size === 0
    form.querySelector('[data-selected-count]').textContent = \`\${selected.size} selected\`
    for (const checkbox of body.querySelectorAll('input[type="checkbox"]')) {
      checkbox.checked = selected.has(checkbox.value)
    }
    const total = filteredTasks().length
    const first = total ? (pageNumber - 1) * Number(pageSize.value) + 1 : 0
    const last = first ? first + visible.length - 1 : 0
    status.textContent = \`Showing \${first}-\${last} of \${total}\${selected.size ? \`. \${selected.size} selected\` : ''}\`
  }

  function render() {
    const filtered = filteredTasks()
    const limit = Number(pageSize.value)
    const pages = Math.max(1, Math.ceil(filtered.length / limit))
    pageNumber = Math.min(pageNumber, pages)
    visible = filtered.slice((pageNumber - 1) * limit, pageNumber * limit)
    const visibleIds = new Set(visible.map(task => task.id))
    for (const id of selected) {
      if (!visibleIds.has(id)) selected.delete(id)
    }
    body.replaceChildren(...visible.map(task => {
      const row = document.createElement('tr')
      const choose = node('td')
      const checkbox = node('input', 'sds-checkbox')
      checkbox.type = 'checkbox'
      checkbox.name = 'task[]'
      checkbox.value = task.id
      checkbox.setAttribute('aria-label', \`Select \${task.id}\`)
      choose.append(checkbox)
      const name = node('th')
      name.scope = 'row'
      const details = node('button', 'sds-button', task.id)
      details.type = 'button'
      details.dataset.sdsVariant = 'text'
      details.dataset.sdsDensity = 'compact'
      details.addEventListener('click', () => {
        dialog.querySelector('[data-task-description]').textContent = \`\${task.id}: \${task.description}\`
        dialog.querySelector('[data-task-assignee]').textContent = \`Assignee: \${task.assignee || 'Unassigned'}\`
        dialog.querySelector('[data-task-status]').textContent = \`Status: \${task.status}\`
        dialogTrigger = details
        dialog.showModal()
      })
      name.append(details)
      const owner = node('td')
      const person = node('div', 'sds-cluster')
      person.dataset.sdsGap = 'sm'
      const initials = task.assignee ? task.assignee.split(' ').map(part => part[0]).join('') : '?'
      const avatar = node('span', 'sds-avatar', initials)
      avatar.dataset.sdsSize = 'sm'
      avatar.setAttribute('aria-hidden', 'true')
      person.append(avatar, node('span', '', task.assignee || 'Unassigned'))
      owner.append(person)
      const state = node('td')
      const labels = node('div', 'sds-stack')
      labels.dataset.sdsGap = 'xs'
      const badge = node('span', 'sds-badge', task.status.toUpperCase())
      badge.dataset.sdsVariant = 'light-border'
      badge.dataset.sdsTone = { open: 'warning', submitted: 'info', approved: 'success' }[task.status]
      const badgeLine = node('div')
      badgeLine.append(badge)
      const detail = node('small', '', { open: 'Open', submitted: 'Testing', approved: 'Recently updated' }[task.status])
      labels.append(badgeLine, detail)
      state.append(labels)
      const actions = node('td')
      const menu = document.createElement('sds-dropdown')
      menu.setAttribute('hide-caret', '')
      menu.setAttribute('width', 'sm')
      const trigger = node('button', 'sds-button', '\\u22ef')
      trigger.type = 'button'
      trigger.dataset.sdsShape = 'icon'
      trigger.dataset.taskMenu = task.id
      trigger.setAttribute('aria-label', \`Actions for \${task.id}\`)
      const commands = document.createElement('menu')
      for (const [label, key, value] of [['Mark approved', 'status', 'approved'], ['Assign to me', 'assignee', 'Jamie Carter']]) {
        const item = document.createElement('li')
        const button = node('button', 'sds-button', label)
        button.type = 'button'
        button.disabled = task[key] === value
        button.addEventListener('click', () => {
          task[key] = value
          selected.clear()
          render()
          const next = form.querySelector(\`[data-task-menu="\${task.id}"]\`)
          ;(next ?? search).focus()
          announcement.textContent = \`\${task.id}: \${label.toLowerCase()}. Changes are local to this example.\`
        })
        item.append(button)
        commands.append(item)
      }
      menu.append(trigger, commands)
      actions.append(menu)
      row.append(choose, name, node('td', '', task.description), owner, state, actions)
      return row
    }))
    if (!visible.length) {
      const row = document.createElement('tr')
      const empty = node('td', '', 'No tasks match these filters.')
      empty.colSpan = 6
      row.append(empty)
      body.append(row)
    }
    const pageButton = (label, target, text, disabled = false) => {
      const item = document.createElement('li')
      const button = node('button', '', text)
      button.type = 'button'
      button.disabled = disabled
      button.setAttribute('aria-label', label)
      if (text === '\\u2039' || text === '\\u203a') {
        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        icon.setAttribute('viewBox', '0 0 8 13')
        icon.setAttribute('aria-hidden', 'true')
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        path.setAttribute('d', text === '\\u2039'
          ? 'M7.35 1.13 2.73 6.75l4.62 4.65-1.23 1.23L.87 7.38a.86.86 0 0 1 0-1.23L6.12.9l1.23 1.23Z'
          : 'm.62 1.13 1.23-1.23 5.25 5.25a.86.86 0 0 1 0 1.23l-5.25 5.25-1.23-1.23 4.62-4.65L.62 1.13Z')
        icon.append(path)
        button.replaceChildren(icon)
      }
      if (target === pageNumber && /^\\d+$/.test(text)) button.setAttribute('aria-current', 'page')
      button.addEventListener('click', () => {
        pageNumber = target
        selected.clear()
        render()
        pagination.querySelector('[aria-current="page"]')?.focus()
      })
      item.append(button)
      return item
    }
    pagination.replaceChildren(
      pageButton('Previous task page', pageNumber - 1, '\\u2039', pageNumber === 1),
      ...Array.from({ length: pages }, (_, index) => pageButton(\`Task page \${index + 1}\`, index + 1, String(index + 1))),
      pageButton('Next task page', pageNumber + 1, '\\u203a', pageNumber === pages),
    )
    form.querySelector('th[aria-sort]').setAttribute('aria-sort', ascending ? 'ascending' : 'descending')
    updateSelection()
  }

  function filter() {
    pageNumber = 1
    selected.clear()
    render()
  }

  function exportTasks(records) {
    const csvValue = value => \`"\${String(value).replace(/^[=+\\-@\\t\\r]/, "'$&").replaceAll('"', '""')}"\`
    const csv = [['Task', 'Description', 'Assignee', 'Status'], ...records.map(task => [task.id, task.description, task.assignee || 'Unassigned', task.status])]
      .map(row => row.map(csvValue).join(',')).join('\\r\\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'project-tasks.csv'
    document.body.append(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    announcement.textContent = \`Exported \${records.length} tasks.\`
  }

  search.addEventListener('input', filter)
  assigneeFilter.addEventListener('change', filter)
  statusFilter.addEventListener('change', filter)
  pageSize.addEventListener('change', filter)
  for (const button of form.querySelectorAll('[data-task-scope]')) {
    button.addEventListener('click', () => {
      scope = scope === button.dataset.taskScope ? 'all' : button.dataset.taskScope
      for (const control of form.querySelectorAll('[data-task-scope]')) {
        control.setAttribute('aria-pressed', String(control.dataset.taskScope === scope))
      }
      assigneeFilter.value = 'all'
      filter()
    })
  }
  all.addEventListener('change', () => {
    for (const task of visible) {
      if (all.checked) selected.add(task.id)
      else selected.delete(task.id)
    }
    updateSelection()
  })
  body.addEventListener('change', event => {
    if (!event.target.matches('input[type="checkbox"]')) return
    if (event.target.checked) selected.add(event.target.value)
    else selected.delete(event.target.value)
    updateSelection()
  })
  form.querySelector('[data-clear-selection]').addEventListener('click', () => {
    selected.clear()
    updateSelection()
    all.focus()
  })
  form.querySelector('[data-bulk-action]').addEventListener('click', () => {
    const count = selected.size
    for (const task of tasks) {
      if (selected.has(task.id)) task.status = 'approved'
    }
    selected.clear()
    render()
    ;(all.disabled ? search : all).focus()
    announcement.textContent = \`\${count} tasks marked approved. Changes are local to this example.\`
  })
  for (const button of form.querySelectorAll('[data-sort], [data-sort-order]')) {
    button.addEventListener('click', () => {
      ascending = !ascending
      filter()
    })
  }
  form.querySelector('[data-export-selected]').addEventListener('click', () => exportTasks(tasks.filter(task => selected.has(task.id))))
  form.querySelector('[data-export-results]').addEventListener('click', () => exportTasks(filteredTasks()))
  form.querySelector('[data-close-task]').addEventListener('click', () => dialog.close())
  dialog.addEventListener('close', () => {
    dialogTrigger?.focus()
    dialogTrigger = null
  })
  form.addEventListener('reset', event => setTimeout(() => {
    if (event.defaultPrevented) return
    tasks = initial.map(task => ({ ...task }))
    scope = 'all'
    ascending = true
    for (const button of form.querySelectorAll('[data-task-scope]')) button.setAttribute('aria-pressed', 'false')
    filter()
    search.focus()
    announcement.textContent = 'Initial tasks and filters restored.'
  }, 0))
  form.addEventListener('submit', event => {
    event.preventDefault()
    filter()
  })
  render()
  initializedForms.add(form)
}

if (typeof document !== 'undefined' && document.querySelector('#table-selection-example')) {
  setupTableSelectionExample()
}
`,Xe=`const initializedForms = new WeakSet()

export function setupMultipleSelectionExample() {
  const form = document.querySelector('#multiple-selection-example')
  if (!form) throw new Error('Missing multiple selection example form.')
  if (initializedForms.has(form)) return
  const picker = form.querySelector('sds-combobox')
  const query = picker.querySelector('input')
  const options = [...picker.querySelectorAll('li')]
  const tags = form.querySelector('[data-selected-topics]')
  const status = form.querySelector('p[role="status"]')
  const initial = [...tags.querySelectorAll('input[type="hidden"]')].map(input => input.value)
  const selected = new Set(initial)

  function render() {
    tags.replaceChildren()
    for (const option of options) {
      const value = option.dataset.sdsValue
      if (!selected.has(value)) {
        option.removeAttribute('aria-disabled')
        continue
      }
      option.setAttribute('aria-disabled', 'true')
      const hidden = document.createElement('input')
      hidden.type = 'hidden'
      hidden.name = 'topic'
      hidden.value = value
      const tag = document.createElement('button')
      tag.type = 'button'
      tag.className = 'sds-tag'
      tag.textContent = \`\${option.textContent.trim()} \\u00d7\`
      tag.setAttribute('aria-label', \`Remove \${option.textContent.trim()}\`)
      tag.addEventListener('click', () => {
        const buttons = [...tags.querySelectorAll('button')]
        const index = buttons.indexOf(tag)
        selected.delete(value)
        render()
        const remaining = tags.querySelectorAll('button')
        ;(remaining[Math.min(index, remaining.length - 1)] ?? query).focus()
        status.textContent = \`\${option.textContent.trim()} removed. \${selected.size} selected.\`
      })
      tags.append(hidden, tag)
    }
    query.setCustomValidity(selected.size ? '' : 'Choose at least one topic.')
  }

  picker.addEventListener('sds-select', event => {
    selected.add(event.detail.value)
    render()
    queueMicrotask(() => {
      query.value = ''
      query.dispatchEvent(new Event('input', { bubbles: true }))
    })
    status.textContent = \`\${selected.size} topics selected.\`
  })
  form.addEventListener('reset', event => setTimeout(() => {
    if (event.defaultPrevented) return
    selected.clear()
    initial.forEach(value => selected.add(value))
    render()
    query.dispatchEvent(new Event('input', { bubbles: true }))
    status.textContent = 'Initial selections restored.'
  }, 0))
  form.addEventListener('submit', event => {
    event.preventDefault()
    status.textContent = \`Submitted topic IDs: \${JSON.stringify(new FormData(form).getAll('topic'))}\`
  })
  render()
  initializedForms.add(form)
}

if (typeof document !== 'undefined' && document.querySelector('#multiple-selection-example')) {
  setupMultipleSelectionExample()
}
`,Ze=`const initializedForms = new WeakSet()

export function setupInputActionsExample() {
  const form = document.querySelector('#input-actions-example')
  if (!form) throw new Error('Missing input actions example form.')
  if (initializedForms.has(form)) return
  const password = form.querySelector('input[type="password"]')
  const reveal = form.querySelector('[data-reveal]')
  const search = form.querySelector('input[type="search"]')
  const status = form.querySelector('[role="status"]')

  reveal.addEventListener('click', () => {
    const visible = password.type === 'password'
    password.type = visible ? 'text' : 'password'
    reveal.setAttribute('aria-pressed', String(visible))
  })
  form.querySelector('[data-clear]').addEventListener('click', () => {
    search.value = ''
    search.dispatchEvent(new Event('input', { bubbles: true }))
    search.focus()
    status.textContent = 'Search cleared.'
  })
  form.querySelector('[data-copy-value]').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(form.querySelector('input[readonly]').value)
      status.textContent = 'Project URL copied.'
    } catch (error) {
      status.textContent = 'Copy failed. Select the project URL and copy it manually.'
      console.error('Could not copy the project URL.', error)
    }
  })
  form.addEventListener('reset', event => setTimeout(() => {
    if (event.defaultPrevented) return
    password.type = 'password'
    reveal.setAttribute('aria-pressed', 'false')
    status.textContent = ''
  }, 0))
  form.addEventListener('submit', event => {
    event.preventDefault()
    status.textContent = \`Search: \${new FormData(form).get('query')}. Password \${password.value ? 'provided' : 'not provided'}.\`
  })
  initializedForms.add(form)
}

if (typeof document !== 'undefined' && document.querySelector('#input-actions-example')) {
  setupInputActionsExample()
}
`,Qe=`const initializedForms = new WeakSet()

export function setupDateRangeExample() {
  const form = document.querySelector('#date-range-example')
  if (!form) throw new Error('Missing date range example form.')
  if (initializedForms.has(form)) return
  const start = form.querySelector('[name="start"]')
  const end = form.querySelector('[name="end"]')
  const error = form.querySelector('[data-date-error]')
  const status = form.querySelector('[role="status"]')

  function validateRange() {
    const invalid = Boolean(start.value && end.value && end.valueAsNumber < start.valueAsNumber)
    end.min = start.value
    end.setCustomValidity(invalid ? 'End date must be on or after start date.' : '')
    end.setAttribute('aria-invalid', String(invalid))
    error.textContent = invalid ? 'End date must be on or after start date.' : ''
  }

  function calendarDate(date) {
    return \`\${date.getFullYear()}-\${String(date.getMonth() + 1).padStart(2, '0')}-\${String(date.getDate()).padStart(2, '0')}\`
  }

  start.addEventListener('input', validateRange)
  end.addEventListener('input', validateRange)
  form.querySelector('[data-last-week]').addEventListener('click', () => {
    const today = new Date()
    const first = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6)
    start.value = calendarDate(first)
    end.value = calendarDate(today)
    validateRange()
    status.textContent = 'Selected the last 7 calendar days, including today.'
  })
  form.addEventListener('reset', event => setTimeout(() => {
    if (event.defaultPrevented) return
    validateRange()
    status.textContent = ''
  }, 0))
  form.addEventListener('submit', event => {
    event.preventDefault()
    validateRange()
    if (!form.reportValidity()) return
    const values = new FormData(form)
    status.textContent = \`Reporting period: \${values.get('start')} through \${values.get('end')} (inclusive).\`
  })
  validateRange()
  initializedForms.add(form)
}

if (typeof document !== 'undefined' && document.querySelector('#date-range-example')) {
  setupDateRangeExample()
}
`,$e=`const initializedForms = new WeakSet()

export function setupFileUploadExample() {
  const form = document.querySelector('#file-upload-example')
  if (!form) throw new Error('Missing file upload example form.')
  if (initializedForms.has(form)) return
  const input = form.querySelector('input[type="file"]')
  const list = form.querySelector('ul')
  const status = form.querySelector('[role="status"]')
  const entries = new Set()
  const maxBytes = 10 * 1024 * 1024
  const sizeFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 })

  function validateQueue() {
    input.setCustomValidity([...entries].some(entry => !entry.invalid) ? '' : 'Choose at least one PDF smaller than 10 MB.')
  }

  function updateActions(entry) {
    const focused = document.activeElement
    entry.retry.disabled = Boolean(entry.request) || entry.invalid || entry.complete
    entry.cancel.disabled = !entry.request
    entry.retry.hidden = Boolean(entry.request) || entry.invalid || entry.complete
    entry.cancel.hidden = !entry.request
    if ((focused === entry.retry || focused === entry.cancel) && focused.hidden) {
      const next = entry.request ? entry.cancel : entry.complete || entry.invalid ? entry.remove : entry.retry
      next.focus()
    }
  }

  function send(entry) {
    if (entry.invalid || entry.request || entry.complete) return
    const request = new XMLHttpRequest()
    entry.request = request
    entry.message.textContent = 'Uploading'
    entry.progress.hidden = false
    entry.progress.removeAttribute('value')
    updateActions(entry)
    request.open('POST', form.action)
    request.timeout = 60_000
    request.upload.addEventListener('progress', event => {
      if (event.lengthComputable) {
        entry.progress.max = event.total
        entry.progress.value = event.loaded
      }
    })
    function settle(message, complete = false) {
      entry.request = null
      entry.complete = complete
      entry.message.textContent = message
      entry.progress.hidden = true
      entry.retry.textContent = 'Retry'
      entry.retry.setAttribute('aria-label', \`Retry \${entry.file.name}\`)
      updateActions(entry)
      if (entries.has(entry)) status.textContent = \`\${entry.file.name}: \${message}\`
    }
    request.addEventListener('load', () => {
      if (request.status >= 200 && request.status < 300) settle('Uploaded', true)
      else settle(\`Upload failed (HTTP \${request.status}). Retry when the server is ready.\`)
    })
    request.addEventListener('error', () => settle('Network error. Check your connection and retry.'))
    request.addEventListener('timeout', () => settle('Upload timed out. Retry.'))
    request.addEventListener('abort', () => settle('Upload cancelled. You can retry.'))
    const body = new FormData()
    body.append('attachment', entry.file, entry.file.name)
    request.send(body)
  }

  input.addEventListener('change', () => {
    for (const file of input.files) {
      if ([...entries].some(entry => entry.file.name === file.name && entry.file.size === file.size && entry.file.lastModified === file.lastModified)) continue
      const row = document.createElement('li')
      row.className = 'sds-file-item'
      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      icon.setAttribute('viewBox', '0 0 24 24')
      icon.setAttribute('aria-hidden', 'true')
      icon.innerHTML = '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8Zm0 0v5h5M9 13h6m-6 4h6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'
      const details = document.createElement('div')
      details.className = 'sds-file-details'
      const title = document.createElement('strong')
      title.textContent = file.name
      const metadata = document.createElement('small')
      const size = document.createElement('span')
      size.textContent = file.size < 1024
        ? \`\${file.size} B\`
        : file.size < 1024 * 1024
          ? \`\${sizeFormat.format(file.size / 1024)} KB\`
          : \`\${sizeFormat.format(file.size / (1024 * 1024))} MB\`
      const message = document.createElement('span')
      const progress = document.createElement('progress')
      progress.className = 'sds-progress'
      progress.hidden = true
      progress.setAttribute('aria-label', \`Upload progress for \${file.name}\`)
      const actions = document.createElement('div')
      actions.className = 'sds-action-group'
      const button = (label, action) => {
        const control = document.createElement('button')
        control.type = 'button'
        control.className = 'sds-button'
        control.dataset.sdsVariant = 'text'
        control.dataset.sdsSize = 'sm'
        control.textContent = label
        control.setAttribute('aria-label', \`\${label} \${file.name}\`)
        control.addEventListener('click', action)
        actions.append(control)
        return control
      }
      const invalid = file.size >= maxBytes || !file.name.toLowerCase().endsWith('.pdf')
      const entry = { file, invalid, complete: false, request: null, message, progress, retry: null, cancel: null, remove: null }
      entry.retry = button('Upload', () => send(entry))
      entry.cancel = button('Cancel', () => entry.request?.abort())
      entry.remove = button('Remove', () => {
        entries.delete(entry)
        entry.request?.abort()
        row.remove()
        input.focus()
        validateQueue()
        status.textContent = \`\${file.name} removed.\`
      })
      entry.remove.dataset.sdsTone = 'danger'
      updateActions(entry)
      message.textContent = invalid ? 'Choose a PDF smaller than 10 MB.' : 'Ready to upload'
      metadata.append(size, message)
      details.append(title, metadata, progress)
      row.append(icon, details, actions)
      entries.add(entry)
      list.append(row)
    }
    input.value = ''
    validateQueue()
    status.textContent = \`\${entries.size} files listed.\`
  })
  form.addEventListener('formdata', event => {
    event.formData.delete(input.name)
    for (const entry of entries) {
      if (!entry.invalid) event.formData.append(input.name, entry.file, entry.file.name)
    }
  })
  form.addEventListener('submit', event => {
    event.preventDefault()
    for (const entry of entries) send(entry)
  })
  form.addEventListener('reset', event => setTimeout(() => {
    if (event.defaultPrevented) return
    const pending = [...entries]
    entries.clear()
    for (const entry of pending) entry.request?.abort()
    list.replaceChildren()
    status.textContent = 'File queue cleared.'
    validateQueue()
  }, 0))
  validateQueue()
  initializedForms.add(form)
}

if (typeof document !== 'undefined' && document.querySelector('#file-upload-example')) {
  setupFileUploadExample()
}
`;Fe(),Le(),ze(),Ve(),Ue(),Ge(),qe();var et={selection:Je,"table-selection":Ye,"multiple-selection":Xe,"input-actions":Ze,"date-range":Qe,"file-upload":$e},tt=document.querySelector(`#remote-combobox`),nt=document.querySelector(`#team-options`),rt=[`Accessibility`,`Engineering`,`Research`];tt?.addEventListener(`input`,()=>{if(!nt)return;let e=rt.filter(e=>e.toLowerCase().includes(tt.value.toLowerCase()));nt.replaceChildren(...e.map(e=>{let t=document.createElement(`li`);return t.textContent=e,t}))});var it=new Map([[`p-atlas`,{id:`p-atlas`,name:`Atlas`,team:`Research`,owner:`Avery`}],[`p-orion`,{id:`p-orion`,name:`Orion`,team:`Operations`,owner:`Blair`}],[`p-vega`,{id:`p-vega`,name:`Vega`,team:`Engineering`,owner:`Casey`}]]),at=document.querySelector(`sds-combobox#record-picker`),H=document.querySelector(`#record-combobox`),U=document.querySelector(`#record-id`),W=document.querySelector(`#record-selection`);H?.addEventListener(`input`,()=>{U&&(U.value=``),W&&(W.textContent=``)}),at?.addEventListener(`sds-select`,e=>{let{option:t,value:n}=e.detail,r=it.get(n);if(!r){console.error(`The selected project record is missing.`,t);return}U&&(U.value=r.id),W&&(W.textContent=`${r.name}: ${r.team}, owner ${r.owner} (ID ${r.id})`),H&&(H.value=``)}),document.querySelector(`#record-form`)?.addEventListener(`reset`,()=>{U&&(U.value=``),W&&(W.textContent=``)});var ot=document.querySelector(`sds-combobox#topic-picker`),st=document.querySelector(`#topic-combobox`),ct=document.querySelector(`#topic-tags`),G=document.querySelector(`#topic-status`);ot?.addEventListener(`sds-select`,e=>{let{option:t}=e.detail,n=t.textContent?.trim()??``;t.setAttribute(`aria-disabled`,`true`);let r=document.createElement(`button`);r.type=`button`,r.className=`sds-tag`,r.dataset.sdsTone=`danger`,r.setAttribute(`aria-label`,`Remove ${n}`);let i=document.createElement(`span`);i.className=`sds-tag-label`,i.textContent=n;let a=document.createElement(`span`);a.className=`sds-tag-action`,a.dataset.sdsTone=`danger`,a.setAttribute(`aria-hidden`,`true`),a.textContent=`×`,r.addEventListener(`click`,()=>{t.removeAttribute(`aria-disabled`),r.remove(),G&&(G.textContent=`${n} removed.`)}),r.append(i,a),ct?.append(r),st&&(st.value=``),G&&(G.textContent=`${n} added.`)});var K=document.querySelector(`[data-sds-root]`),lt=document.querySelector(`#theme`),ut=document.querySelector(`#color-scheme`);lt?.addEventListener(`change`,()=>{K?.setAttribute(`data-sds-theme`,lt.value)}),ut?.addEventListener(`change`,()=>{K?.setAttribute(`data-sds-color-scheme`,ut.value)});var q=document.getElementById(`layout-examples`);q&&(q.firstElementChild?.remove(),document.getElementById(`layouts`)?.append(q));for(let e of document.querySelectorAll(`[data-copy-source]`)){let t=document.getElementById(e.dataset.copySource??``),n=document.getElementById(e.dataset.copyTarget??``)?.querySelector(`code`);t&&n&&(n.textContent=t.outerHTML)}var J=[],Y=(e,t,n=!1)=>{let r=e.dataset.recipeScript,i=r?et[r]:void 0;if(r&&!i)throw Error(`Unknown example script: ${r}`);let a=!n&&!e.hasAttribute(`data-copy-example`)?e.querySelector(`h3, h4`):null;a&&(a.dataset.sdsSize=`sm`);let o=e.cloneNode(!0);for(let e of[o,...o.querySelectorAll(`*`)])e.removeAttribute(`data-copy-layout`),e.removeAttribute(`data-copy-example`),e.removeAttribute(`data-recipe-script`),e.removeAttribute(`data-search-terms`);if(n){let e=o.dataset.sdsVariant,t=o.querySelector(`#${e}-page-content`);t&&(t.id=`page-content`);for(let e of o.querySelectorAll(`a[href="#composition"]`))e.setAttribute(`href`,`#page-content`);let n=o.querySelector(`.sds-app-main`);if(n){let e=document.createElement(`main`);for(let t of n.attributes)e.setAttribute(t.name,t.value);e.append(...n.childNodes),n.replaceWith(e)}}for(let e of o.querySelectorAll(`[data-copy-target]`)){let t=e.getAttribute(`data-copy-target`);t&&o.querySelector(`#${CSS.escape(t)}`)?.remove(),e.remove()}let s=document.createElement(`details`);s.className=`sds-disclosure`,s.dataset.exampleSource=``,s.dataset.sourceLabel=`${t} HTML`;let c=document.createElement(`summary`);c.textContent=i?`View HTML + JavaScript`:`View HTML`;let l=document.createElement(`pre`);l.id=`copy-example-${document.querySelectorAll(`[id^="copy-example-"]`).length+1}`,l.tabIndex=0;let u=document.createElement(`code`),d=o.outerHTML,f=document.getElementById(`cdn-install`)?.textContent??``,p=f.match(/href="([^"]+\/sds\.css)"/)?.[1].replace(`/sds.css`,`/brand.css`);u.textContent=n?`<!doctype html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>${t}</title>\n${f}\n${p?`<link rel="stylesheet" href="${p}">`:``}\n</head>\n<body class="sds-document" data-sds-root data-sds-theme="${o.dataset.sdsTheme}">\n${d}\n</body>\n</html>`:`${d}${i?`\n<script type="module">\n${i}\n<\/script>`:``}`,l.append(u);let m=document.createElement(`div`);m.className=`sds-prose`,m.append(l),s.append(c,m);let h=document.createElement(`div`);h.className=`sds-cluster`,h.dataset.sdsGap=`sm`;let g=document.createElement(`button`);g.type=`button`,g.className=`sds-button`,g.dataset.sdsDensity=`compact`,g.dataset.sdsVariant=`outlined`,g.dataset.copyTarget=l.id,g.textContent=i?`Copy HTML + JS`:n?`Copy page`:`Copy HTML`,g.setAttribute(`aria-label`,n?`Copy ${t.toLowerCase()} page`:i?`Copy ${t.toLowerCase()} HTML + JavaScript`:`Copy ${t.toLowerCase()} markup`),h.append(g);let _=document.createElement(`header`);_.className=`sds-section-header`,_.dataset.exampleTools=``,_.tabIndex=-1;let v=document.createElement(`div`);v.className=`sds-stack`,v.dataset.sdsGap=`xs`;let y=n?`Page starter`:e.hasAttribute(`data-copy-example`)?`Page pattern`:i?`Application recipe`:`Component example`,b=document.createElement(`p`);b.className=`sds-eyebrow`,b.textContent=n?`${y} / ${o.dataset.sdsTheme===`plaid`?`Plaid`:`Forge`}`:y;let x=a??document.createElement(`h3`);a?.replaceWith(document.createComment(`playground example heading`)),a||(x.className=`sds-text-h3`,x.dataset.sdsSize=`sm`,x.textContent=t),v.append(b,x),_.append(v,h);let S;if(n){let n=document.createElement(`details`);n.className=`sds-disclosure`;let r=document.createElement(`summary`);r.textContent=`View layout HTML`,n.dataset.sourceLabel=`${t} layout HTML`,n.dataset.exampleSource=``;let i=document.createElement(`pre`);i.id=`${l.id}-layout`,i.tabIndex=0;let a=document.createElement(`code`);a.textContent=d,i.append(a);let u=document.createElement(`div`);u.className=`sds-prose`,u.append(i),n.append(r,u);let f=document.createElement(`button`);f.type=`button`,f.className=`sds-button`,f.dataset.sdsVariant=`outlined`,f.dataset.sdsDensity=`compact`,f.dataset.copyTarget=i.id,f.textContent=`Copy layout`,f.setAttribute(`aria-label`,`Copy ${t.toLowerCase()} layout`),h.append(f);let p=e.closest(`details`);if(!p)throw Error(`Missing preview disclosure for ${t}.`);c.textContent=`View page HTML`,s.dataset.sourceLabel=`${t} page HTML`,S=document.createElement(`article`),S.className=`sds-card sds-stack`,S.dataset.sdsGap=`lg`,S.dataset.sdsPadding=`md`,S.id=`page-starter-${o.dataset.sdsVariant}`,p.before(S),S.append(_,p,s,n)}else{let n=document.createElement(`div`);if(n.className=`sds-stack`,n.dataset.examplePreview=``,e.hasAttribute(`data-copy-example`)){let r=e.closest(`[data-pattern]`);if(!r)throw Error(`Missing pattern container for ${t}.`);S=r,S.classList.add(`sds-card`),n.append(e)}else S=e,n.append(...e.childNodes);S.replaceChildren(_,n,s)}S.dataset.exampleContainer=``;let C=S.closest(`main#top > .sds-page > section`);if(!C)throw Error(`Missing catalog section for ${t}.`);J.push({element:S,title:t,kind:y,section:C,terms:`${t} ${e.dataset.searchTerms??``} ${y}`.toLocaleLowerCase()})},dt=Array.from(document.querySelectorAll(`main#top > .sds-page > section[id], main#top > .sds-page > section[id] > article`));for(let[e,t]of dt.entries())t.id||=`catalog-recipe-${e}`;for(let e of document.querySelectorAll(`[data-copy-layout]`))Y(e,e.dataset.copyLayout??`Layout`,!0);for(let e of document.querySelectorAll(`[data-copy-example]`))Y(e,e.closest(`[data-pattern]`)?.dataset.pattern??`Pattern`);for(let e of document.querySelectorAll(`#composition > article, #forms > article, #content > article, #prose > article, #navigation > article, #loading > article, #actions > article, #feedback > article, #structure > article`))Y(e,e.querySelector(`h3, h4`)?.textContent?.trim()??`Recipe`);var ft=dt.filter(e=>e.matches(`section`));for(let e of ft){let t=J.filter(t=>t.section===e);if(t.length<2)continue;let n=document.createElement(`nav`);n.className=`sds-stack`,n.dataset.sdsGap=`sm`,n.setAttribute(`aria-label`,`${e.querySelector(`h2`)?.textContent?.trim()??e.id} examples`),n.dataset.exampleIndex=``;let r=document.createElement(`p`);r.className=`sds-eyebrow`,r.textContent=`Examples`;let i=document.createElement(`div`);i.className=`sds-cluster`,i.dataset.sdsGap=`sm`;for(let e of t){let t=document.createElement(`a`);t.className=`sds-button`,t.dataset.sdsVariant=`outlined`,t.dataset.sdsTone=`neutral`,t.dataset.sdsDensity=`compact`,t.href=`#${e.element.id}`,t.textContent=e.title,i.append(t)}n.append(r,i),e.querySelector(`:scope > .sds-section-header`)?.after(n)}var pt={actions:`buttons links icon button`,forms:`input checkbox radio switch select textarea validation`,navigation:`accordion disclosure breadcrumb pagination tabs menu dropdown`,structure:`drawer sheet panel modal dialog tooltip popover`,loading:`skeleton spinner progress empty state no results`,composition:`grid stack cluster responsive layout spacing`},mt=[...ft.map(e=>({element:e,title:e.querySelector(`h2`)?.textContent?.trim()??e.id,kind:`Section`,section:e,terms:`${e.querySelector(`h2`)?.textContent??``} ${pt[e.id]??``}`.toLocaleLowerCase()})),...J],X=document.querySelector(`#playground-search`),Z=document.querySelector(`#playground-results`),ht=document.querySelector(`#playground-search-status`);if(!X||!Z||!ht)throw Error(`Missing playground search controls.`);X.addEventListener(`input`,()=>{let e=X.value.trim().toLocaleLowerCase(),t=e?mt.filter(t=>e.split(/\s+/).every(e=>t.terms.includes(e))):[];Z.replaceChildren(...t.map(e=>{let t=document.createElement(`li`);t.className=`sds-list-item`;let n=document.createElement(`a`);n.className=`sds-link`,n.href=`#${e.element.id}`,n.textContent=e.title;let r=document.createElement(`h3`);r.append(n);let i=document.createElement(`p`);return i.textContent=`${e.kind} / ${e.section.querySelector(`h2`)?.textContent??``}`,t.append(r,i),t})),Z.hidden=!e,ht.textContent=e?`${t.length} matching components or recipes.`:``});function gt(){let e=mt.find(e=>`#${e.element.id}`===window.location.hash);if(!e)return;for(let t=e.element.parentElement;t;t=t.parentElement)t instanceof HTMLDetailsElement&&(t.open=!0);e.element.scrollIntoView({block:`start`,behavior:`instant`});let t=(document.querySelector(`body > .sds-app > .sds-app-header`)?.getBoundingClientRect().bottom??0)-e.element.getBoundingClientRect().top;t>0&&window.scrollBy({top:-t,behavior:`instant`}),e.element.querySelector(`:scope > [data-example-tools]`)?.focus({preventScroll:!0})}window.addEventListener(`hashchange`,gt),window.location.hash&&gt();var _t=document.querySelector(`.sds-sidebar > nav`),Q=Array.from(_t?.querySelectorAll(`a[href^="#"]`)??[]).flatMap(e=>{let t=document.getElementById(e.hash.slice(1));return t?[{link:e,section:t}]:[]});if(_t&&Q.length>0){let e=e=>{for(let{link:t,section:n}of Q)n===e?t.setAttribute(`aria-current`,`location`):t.removeAttribute(`aria-current`)},t=Q.find(({link:e})=>e.hash===window.location.hash)?.section??Q[0].section,n=new Set;e(t);let r=new IntersectionObserver(t=>{for(let e of t)e.target instanceof HTMLElement&&(e.isIntersecting?n.add(e.target):n.delete(e.target));let r=[...n].sort((e,t)=>e.getBoundingClientRect().top-t.getBoundingClientRect().top)[0];r&&e(r)},{rootMargin:`-12% 0px -75% 0px`});for(let{section:e}of Q)r.observe(e)}var $=document.querySelector(`#copy-status`);for(let e of document.querySelectorAll(`[data-copy-target]`))e.addEventListener(`click`,async()=>{let t=e.dataset.copyTarget,n=t?document.getElementById(t):null;if(!n){let e=`Copy target "${t??``}" was not found.`;$&&($.textContent=e),console.error(e);return}let r=e.textContent;try{await navigator.clipboard.writeText(n.textContent??``),e.textContent=`Copied`,$&&($.textContent=`Example copied to clipboard.`)}catch(t){e.textContent=`Copy failed`,$&&($.textContent=`The browser could not copy the example to the clipboard.`),console.error(`Could not copy the SDS Lite example.`,t);let r=n.closest(`details`);r&&(r.open=!0),(r?.querySelector(`summary`)??n).focus()}window.setTimeout(()=>{e.textContent=r},2e3)});for(let e of document.querySelectorAll(`[data-sds-callout-close]`))e.addEventListener(`click`,()=>{let t=e.closest(`.sds-callout`);if(!t){console.error(`Callout close control is not inside an SDS callout.`);return}t.hidden=!0});document.addEventListener(`submit`,e=>e.preventDefault());