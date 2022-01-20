/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t=window.ShadowRoot&&(void 0===window.ShadyCSS||window.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,i=Symbol(),s=new Map;class h{constructor(t,s){if(this._$cssResult$=!0,s!==i)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t}get styleSheet(){let i=s.get(this.cssText);return t&&void 0===i&&(s.set(this.cssText,i=new CSSStyleSheet),i.replaceSync(this.cssText)),i}toString(){return this.cssText}}const e=t?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let s="";for(const i of t.cssRules)s+=i.cssText;return(t=>new h("string"==typeof t?t:t+"",i))(s)})(t):t
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */;var n;const o=window.trustedTypes,r=o?o.emptyScript:"",l=window.reactiveElementPolyfillSupport,a={toAttribute(t,i){switch(i){case Boolean:t=t?r:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,i){let s=t;switch(i){case Boolean:s=null!==t;break;case Number:s=null===t?null:Number(t);break;case Object:case Array:try{s=JSON.parse(t)}catch(t){s=null}}return s}},c=(t,i)=>i!==t&&(i==i||t==t),u={attribute:!0,type:String,converter:a,reflect:!1,hasChanged:c};class d extends HTMLElement{constructor(){super(),this._$Et=new Map,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Ei=null,this.o()}static addInitializer(t){var i;null!==(i=this.l)&&void 0!==i||(this.l=[]),this.l.push(t)}static get observedAttributes(){this.finalize();const t=[];return this.elementProperties.forEach(((i,s)=>{const h=this._$Eh(s,i);void 0!==h&&(this._$Eu.set(h,s),t.push(h))})),t}static createProperty(t,i=u){if(i.state&&(i.attribute=!1),this.finalize(),this.elementProperties.set(t,i),!i.noAccessor&&!this.prototype.hasOwnProperty(t)){const s="symbol"==typeof t?Symbol():"__"+t,h=this.getPropertyDescriptor(t,s,i);void 0!==h&&Object.defineProperty(this.prototype,t,h)}}static getPropertyDescriptor(t,i,s){return{get(){return this[i]},set(h){const e=this[t];this[i]=h,this.requestUpdate(t,e,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)||u}static finalize(){if(this.hasOwnProperty("finalized"))return!1;this.finalized=!0;const t=Object.getPrototypeOf(this);if(t.finalize(),this.elementProperties=new Map(t.elementProperties),this._$Eu=new Map,this.hasOwnProperty("properties")){const t=this.properties,i=[...Object.getOwnPropertyNames(t),...Object.getOwnPropertySymbols(t)];for(const s of i)this.createProperty(s,t[s])}return this.elementStyles=this.finalizeStyles(this.styles),!0}static finalizeStyles(t){const i=[];if(Array.isArray(t)){const s=new Set(t.flat(1/0).reverse());for(const t of s)i.unshift(e(t))}else void 0!==t&&i.push(e(t));return i}static _$Eh(t,i){const s=i.attribute;return!1===s?void 0:"string"==typeof s?s:"string"==typeof t?t.toLowerCase():void 0}o(){var t;this._$Ep=new Promise((t=>this.enableUpdating=t)),this._$AL=new Map,this._$Em(),this.requestUpdate(),null===(t=this.constructor.l)||void 0===t||t.forEach((t=>t(this)))}addController(t){var i,s;(null!==(i=this._$Eg)&&void 0!==i?i:this._$Eg=[]).push(t),void 0!==this.renderRoot&&this.isConnected&&(null===(s=t.hostConnected)||void 0===s||s.call(t))}removeController(t){var i;null===(i=this._$Eg)||void 0===i||i.splice(this._$Eg.indexOf(t)>>>0,1)}_$Em(){this.constructor.elementProperties.forEach(((t,i)=>{this.hasOwnProperty(i)&&(this._$Et.set(i,this[i]),delete this[i])}))}createRenderRoot(){var i;const s=null!==(i=this.shadowRoot)&&void 0!==i?i:this.attachShadow(this.constructor.shadowRootOptions);return((i,s)=>{t?i.adoptedStyleSheets=s.map((t=>t instanceof CSSStyleSheet?t:t.styleSheet)):s.forEach((t=>{const s=document.createElement("style"),h=window.litNonce;void 0!==h&&s.setAttribute("nonce",h),s.textContent=t.cssText,i.appendChild(s)}))})(s,this.constructor.elementStyles),s}connectedCallback(){var t;void 0===this.renderRoot&&(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),null===(t=this._$Eg)||void 0===t||t.forEach((t=>{var i;return null===(i=t.hostConnected)||void 0===i?void 0:i.call(t)}))}enableUpdating(t){}disconnectedCallback(){var t;null===(t=this._$Eg)||void 0===t||t.forEach((t=>{var i;return null===(i=t.hostDisconnected)||void 0===i?void 0:i.call(t)}))}attributeChangedCallback(t,i,s){this._$AK(t,s)}_$ES(t,i,s=u){var h,e;const n=this.constructor._$Eh(t,s);if(void 0!==n&&!0===s.reflect){const o=(null!==(e=null===(h=s.converter)||void 0===h?void 0:h.toAttribute)&&void 0!==e?e:a.toAttribute)(i,s.type);this._$Ei=t,null==o?this.removeAttribute(n):this.setAttribute(n,o),this._$Ei=null}}_$AK(t,i){var s,h,e;const n=this.constructor,o=n._$Eu.get(t);if(void 0!==o&&this._$Ei!==o){const t=n.getPropertyOptions(o),r=t.converter,l=null!==(e=null!==(h=null===(s=r)||void 0===s?void 0:s.fromAttribute)&&void 0!==h?h:"function"==typeof r?r:null)&&void 0!==e?e:a.fromAttribute;this._$Ei=o,this[o]=l(i,t.type),this._$Ei=null}}requestUpdate(t,i,s){let h=!0;void 0!==t&&(((s=s||this.constructor.getPropertyOptions(t)).hasChanged||c)(this[t],i)?(this._$AL.has(t)||this._$AL.set(t,i),!0===s.reflect&&this._$Ei!==t&&(void 0===this._$E_&&(this._$E_=new Map),this._$E_.set(t,s))):h=!1),!this.isUpdatePending&&h&&(this._$Ep=this._$EC())}async _$EC(){this.isUpdatePending=!0;try{await this._$Ep}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var t;if(!this.isUpdatePending)return;this.hasUpdated,this._$Et&&(this._$Et.forEach(((t,i)=>this[i]=t)),this._$Et=void 0);let i=!1;const s=this._$AL;try{i=this.shouldUpdate(s),i?(this.willUpdate(s),null===(t=this._$Eg)||void 0===t||t.forEach((t=>{var i;return null===(i=t.hostUpdate)||void 0===i?void 0:i.call(t)})),this.update(s)):this._$EU()}catch(t){throw i=!1,this._$EU(),t}i&&this._$AE(s)}willUpdate(t){}_$AE(t){var i;null===(i=this._$Eg)||void 0===i||i.forEach((t=>{var i;return null===(i=t.hostUpdated)||void 0===i?void 0:i.call(t)})),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EU(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$Ep}shouldUpdate(t){return!0}update(t){void 0!==this._$E_&&(this._$E_.forEach(((t,i)=>this._$ES(i,this[i],t))),this._$E_=void 0),this._$EU()}updated(t){}firstUpdated(t){}}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
var v;d.finalized=!0,d.elementProperties=new Map,d.elementStyles=[],d.shadowRootOptions={mode:"open"},null==l||l({ReactiveElement:d}),(null!==(n=globalThis.reactiveElementVersions)&&void 0!==n?n:globalThis.reactiveElementVersions=[]).push("1.2.0");const g=globalThis.trustedTypes,f=g?g.createPolicy("lit-html",{createHTML:t=>t}):void 0,p=`lit$${(Math.random()+"").slice(9)}$`,m="?"+p,y=`<${m}>`,w=document,$=(t="")=>w.createComment(t),b=t=>null===t||"object"!=typeof t&&"function"!=typeof t,M=Array.isArray,S=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,A=/-->/g,T=/>/g,_=/>|[ 	\n\r](?:([^\s"'>=/]+)([ 	\n\r]*=[ 	\n\r]*(?:[^ 	\n\r"'`<>=]|("|')|))|$)/g,k=/'/g,C=/"/g,x=/^(?:script|style|textarea)$/i,E=(t=>(i,...s)=>({_$litType$:t,strings:i,values:s}))(1),O=Symbol.for("lit-noChange"),D=Symbol.for("lit-nothing"),U=new WeakMap,I=w.createTreeWalker(w,129,null,!1),N=(t,i)=>{const s=t.length-1,h=[];let e,n=2===i?"<svg>":"",o=S;for(let i=0;i<s;i++){const s=t[i];let r,l,a=-1,c=0;for(;c<s.length&&(o.lastIndex=c,l=o.exec(s),null!==l);)c=o.lastIndex,o===S?"!--"===l[1]?o=A:void 0!==l[1]?o=T:void 0!==l[2]?(x.test(l[2])&&(e=RegExp("</"+l[2],"g")),o=_):void 0!==l[3]&&(o=_):o===_?">"===l[0]?(o=null!=e?e:S,a=-1):void 0===l[1]?a=-2:(a=o.lastIndex-l[2].length,r=l[1],o=void 0===l[3]?_:'"'===l[3]?C:k):o===C||o===k?o=_:o===A||o===T?o=S:(o=_,e=void 0);const u=o===_&&t[i+1].startsWith("/>")?" ":"";n+=o===S?s+y:a>=0?(h.push(r),s.slice(0,a)+"$lit$"+s.slice(a)+p+u):s+p+(-2===a?(h.push(void 0),i):u)}const r=n+(t[s]||"<?>")+(2===i?"</svg>":"");if(!Array.isArray(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return[void 0!==f?f.createHTML(r):r,h]};class P{constructor({strings:t,_$litType$:i},s){let h;this.parts=[];let e=0,n=0;const o=t.length-1,r=this.parts,[l,a]=N(t,i);if(this.el=P.createElement(l,s),I.currentNode=this.el.content,2===i){const t=this.el.content,i=t.firstChild;i.remove(),t.append(...i.childNodes)}for(;null!==(h=I.nextNode())&&r.length<o;){if(1===h.nodeType){if(h.hasAttributes()){const t=[];for(const i of h.getAttributeNames())if(i.endsWith("$lit$")||i.startsWith(p)){const s=a[n++];if(t.push(i),void 0!==s){const t=h.getAttribute(s.toLowerCase()+"$lit$").split(p),i=/([.?@])?(.*)/.exec(s);r.push({type:1,index:e,name:i[2],strings:t,ctor:"."===i[1]?G:"?"===i[1]?W:"@"===i[1]?B:z})}else r.push({type:6,index:e})}for(const i of t)h.removeAttribute(i)}if(x.test(h.tagName)){const t=h.textContent.split(p),i=t.length-1;if(i>0){h.textContent=g?g.emptyScript:"";for(let s=0;s<i;s++)h.append(t[s],$()),I.nextNode(),r.push({type:2,index:++e});h.append(t[i],$())}}}else if(8===h.nodeType)if(h.data===m)r.push({type:2,index:e});else{let t=-1;for(;-1!==(t=h.data.indexOf(p,t+1));)r.push({type:7,index:e}),t+=p.length-1}e++}}static createElement(t,i){const s=w.createElement("template");return s.innerHTML=t,s}}function R(t,i,s=t,h){var e,n,o,r;if(i===O)return i;let l=void 0!==h?null===(e=s._$Cl)||void 0===e?void 0:e[h]:s._$Cu;const a=b(i)?void 0:i._$litDirective$;return(null==l?void 0:l.constructor)!==a&&(null===(n=null==l?void 0:l._$AO)||void 0===n||n.call(l,!1),void 0===a?l=void 0:(l=new a(t),l._$AT(t,s,h)),void 0!==h?(null!==(o=(r=s)._$Cl)&&void 0!==o?o:r._$Cl=[])[h]=l:s._$Cu=l),void 0!==l&&(i=R(t,l._$AS(t,i.values),l,h)),i}class j{constructor(t,i){this.v=[],this._$AN=void 0,this._$AD=t,this._$AM=i}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}p(t){var i;const{el:{content:s},parts:h}=this._$AD,e=(null!==(i=null==t?void 0:t.creationScope)&&void 0!==i?i:w).importNode(s,!0);I.currentNode=e;let n=I.nextNode(),o=0,r=0,l=h[0];for(;void 0!==l;){if(o===l.index){let i;2===l.type?i=new L(n,n.nextSibling,this,t):1===l.type?i=new l.ctor(n,l.name,l.strings,this,t):6===l.type&&(i=new H(n,this,t)),this.v.push(i),l=h[++r]}o!==(null==l?void 0:l.index)&&(n=I.nextNode(),o++)}return e}m(t){let i=0;for(const s of this.v)void 0!==s&&(void 0!==s.strings?(s._$AI(t,s,i),i+=s.strings.length-2):s._$AI(t[i])),i++}}class L{constructor(t,i,s,h){var e;this.type=2,this._$AH=D,this._$AN=void 0,this._$AA=t,this._$AB=i,this._$AM=s,this.options=h,this._$Cg=null===(e=null==h?void 0:h.isConnected)||void 0===e||e}get _$AU(){var t,i;return null!==(i=null===(t=this._$AM)||void 0===t?void 0:t._$AU)&&void 0!==i?i:this._$Cg}get parentNode(){let t=this._$AA.parentNode;const i=this._$AM;return void 0!==i&&11===t.nodeType&&(t=i.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,i=this){t=R(this,t,i),b(t)?t===D||null==t||""===t?(this._$AH!==D&&this._$AR(),this._$AH=D):t!==this._$AH&&t!==O&&this.$(t):void 0!==t._$litType$?this.T(t):void 0!==t.nodeType?this.S(t):(t=>{var i;return M(t)||"function"==typeof(null===(i=t)||void 0===i?void 0:i[Symbol.iterator])})(t)?this.A(t):this.$(t)}M(t,i=this._$AB){return this._$AA.parentNode.insertBefore(t,i)}S(t){this._$AH!==t&&(this._$AR(),this._$AH=this.M(t))}$(t){this._$AH!==D&&b(this._$AH)?this._$AA.nextSibling.data=t:this.S(w.createTextNode(t)),this._$AH=t}T(t){var i;const{values:s,_$litType$:h}=t,e="number"==typeof h?this._$AC(t):(void 0===h.el&&(h.el=P.createElement(h.h,this.options)),h);if((null===(i=this._$AH)||void 0===i?void 0:i._$AD)===e)this._$AH.m(s);else{const t=new j(e,this),i=t.p(this.options);t.m(s),this.S(i),this._$AH=t}}_$AC(t){let i=U.get(t.strings);return void 0===i&&U.set(t.strings,i=new P(t)),i}A(t){M(this._$AH)||(this._$AH=[],this._$AR());const i=this._$AH;let s,h=0;for(const e of t)h===i.length?i.push(s=new L(this.M($()),this.M($()),this,this.options)):s=i[h],s._$AI(e),h++;h<i.length&&(this._$AR(s&&s._$AB.nextSibling,h),i.length=h)}_$AR(t=this._$AA.nextSibling,i){var s;for(null===(s=this._$AP)||void 0===s||s.call(this,!1,!0,i);t&&t!==this._$AB;){const i=t.nextSibling;t.remove(),t=i}}setConnected(t){var i;void 0===this._$AM&&(this._$Cg=t,null===(i=this._$AP)||void 0===i||i.call(this,t))}}class z{constructor(t,i,s,h,e){this.type=1,this._$AH=D,this._$AN=void 0,this.element=t,this.name=i,this._$AM=h,this.options=e,s.length>2||""!==s[0]||""!==s[1]?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=D}get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}_$AI(t,i=this,s,h){const e=this.strings;let n=!1;if(void 0===e)t=R(this,t,i,0),n=!b(t)||t!==this._$AH&&t!==O,n&&(this._$AH=t);else{const h=t;let o,r;for(t=e[0],o=0;o<e.length-1;o++)r=R(this,h[s+o],i,o),r===O&&(r=this._$AH[o]),n||(n=!b(r)||r!==this._$AH[o]),r===D?t=D:t!==D&&(t+=(null!=r?r:"")+e[o+1]),this._$AH[o]=r}n&&!h&&this.k(t)}k(t){t===D?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,null!=t?t:"")}}class G extends z{constructor(){super(...arguments),this.type=3}k(t){this.element[this.name]=t===D?void 0:t}}const F=g?g.emptyScript:"";class W extends z{constructor(){super(...arguments),this.type=4}k(t){t&&t!==D?this.element.setAttribute(this.name,F):this.element.removeAttribute(this.name)}}class B extends z{constructor(t,i,s,h,e){super(t,i,s,h,e),this.type=5}_$AI(t,i=this){var s;if((t=null!==(s=R(this,t,i,0))&&void 0!==s?s:D)===O)return;const h=this._$AH,e=t===D&&h!==D||t.capture!==h.capture||t.once!==h.once||t.passive!==h.passive,n=t!==D&&(h===D||e);e&&this.element.removeEventListener(this.name,this,h),n&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){var i,s;"function"==typeof this._$AH?this._$AH.call(null!==(s=null===(i=this.options)||void 0===i?void 0:i.host)&&void 0!==s?s:this.element,t):this._$AH.handleEvent(t)}}class H{constructor(t,i,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=i,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){R(this,t)}}const q=window.litHtmlPolyfillSupport;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
var J,K;null==q||q(P,L),(null!==(v=globalThis.litHtmlVersions)&&void 0!==v?v:globalThis.litHtmlVersions=[]).push("2.1.1");class V extends d{constructor(){super(...arguments),this.renderOptions={host:this},this._$Dt=void 0}createRenderRoot(){var t,i;const s=super.createRenderRoot();return null!==(t=(i=this.renderOptions).renderBefore)&&void 0!==t||(i.renderBefore=s.firstChild),s}update(t){const i=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Dt=((t,i,s)=>{var h,e;const n=null!==(h=null==s?void 0:s.renderBefore)&&void 0!==h?h:i;let o=n._$litPart$;if(void 0===o){const t=null!==(e=null==s?void 0:s.renderBefore)&&void 0!==e?e:null;n._$litPart$=o=new L(i.insertBefore($(),t),t,void 0,null!=s?s:{})}return o._$AI(t),o})(i,this.renderRoot,this.renderOptions)}connectedCallback(){var t;super.connectedCallback(),null===(t=this._$Dt)||void 0===t||t.setConnected(!0)}disconnectedCallback(){var t;super.disconnectedCallback(),null===(t=this._$Dt)||void 0===t||t.setConnected(!1)}render(){return O}}V.finalized=!0,V._$litElement$=!0,null===(J=globalThis.litElementHydrateSupport)||void 0===J||J.call(globalThis,{LitElement:V});const Y=globalThis.litElementPolyfillSupport;null==Y||Y({LitElement:V}),(null!==(K=globalThis.litElementVersions)&&void 0!==K?K:globalThis.litElementVersions=[]).push("3.1.1");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Z=(t,i)=>"method"===i.kind&&i.descriptor&&!("value"in i.descriptor)?{...i,finisher(s){s.createProperty(i.key,t)}}:{kind:"field",key:Symbol(),placement:"own",descriptor:{},originalKey:i.key,initializer(){"function"==typeof i.initializer&&(this[i.key]=i.initializer.call(this))},finisher(s){s.createProperty(i.key,t)}};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function Q(t){return function(t){return(i,s)=>void 0!==s?((t,i,s)=>{i.constructor.createProperty(s,t)})(t,i,s):Z(t,i)}({...t,state:!0})}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
var X;null===(X=window.HTMLSlotElement)||void 0===X||X.prototype.assignedElements;var tt,it,st=function(t,i,s,h){for(var e,n=arguments.length,o=n<3?i:null===h?h=Object.getOwnPropertyDescriptor(i,s):h,r=t.length-1;r>=0;r--)(e=t[r])&&(o=(n<3?e(o):n>3?e(i,s,o):e(i,s))||o);return n>3&&o&&Object.defineProperty(i,s,o),o};!function(t){t[t.WALL=0]="WALL",t[t.OPEN=1]="OPEN"}(tt||(tt={})),function(t){t[t.LOADING=0]="LOADING",t[t.START=1]="START",t[t.TUTORIAL=2]="TUTORIAL",t[t.IN_GAME=3]="IN_GAME",t[t.PAUSE=4]="PAUSE",t[t.VICTORY=5]="VICTORY",t[t.GAME_OVER=6]="GAME_OVER"}(it||(it={}));const ht={u:0,r:1,d:2,l:3};let et=!1;function nt(t,...i){et&&console.log(t,...i)}function ot(t){const i=new Image;return i.src=t,i}async function rt(t){return new Promise((i=>{const s=new Image;s.src=t,s.onload=()=>i(s)}))}class lt{constructor(t,i,s){this.neighbours={},this.allowedDirs=[],this.nextDecisionPoints=[],this.mazeDistanceMap=new Map,this.type=t,this.gridCoordinates=i,this.size=s,this.origin={x:i.x*this.size,y:i.y*this.size},this.center={x:(i.x+.5)*this.size,y:(i.y+.5)*this.size},this.top=this.origin.y,this.right=this.origin.x+this.size,this.bottom=this.origin.y+this.size,this.left=this.origin.x}toString(){return`[${this.gridCoordinates.x},${this.gridCoordinates.y}]`}isWall(){return this.type===tt.WALL}isOpen(){return this.type===tt.OPEN}isFork(){return this.allowedDirs.length>2}isDeadEnd(){return this.allowedDirs.length<2}pixelDistance(t){return Math.sqrt(Math.pow(this.center.x-t.center.x,2)+Math.pow(this.center.y-t.center.y,2))}straightDistance(t){return Math.sqrt(Math.pow(this.gridCoordinates.x-t.gridCoordinates.x,2)+Math.pow(this.gridCoordinates.y-t.gridCoordinates.y,2))}manhattanDistance(t){return Math.abs(this.gridCoordinates.x-t.gridCoordinates.x)+Math.abs(this.gridCoordinates.y-t.gridCoordinates.y)}mazeDistance(t){return this.mazeDistanceMap.get(t)||NaN}get width(){return this.size}get height(){return this.size}}class at{constructor(t,i){this.cells=[],this.cellSize=i;const s=t.split("\n").filter((t=>t)),h=s.length,e=s.length&&s[0].split("").filter((t=>t)).length;this.height=h*this.cellSize,this.width=e*this.cellSize,s.forEach(((t,i)=>t.split("").filter((t=>t)).forEach(((t,s)=>{this.cells[s]=this.cells[s]||[],this.cells[s][i]=new lt(" "===t?tt.OPEN:tt.WALL,{x:s,y:i},this.cellSize)})))),this.forEachCell((t=>{t.neighbours=this.getNeighbours(t.gridCoordinates),t.neighbours.u&&t.neighbours.u.isOpen()&&t.allowedDirs.push("u"),t.neighbours.r&&t.neighbours.r.isOpen()&&t.allowedDirs.push("r"),t.neighbours.d&&t.neighbours.d.isOpen()&&t.allowedDirs.push("d"),t.neighbours.l&&t.neighbours.l.isOpen()&&t.allowedDirs.push("l")})),this.forEachCell((t=>{t.nextDecisionPoints=[],t.allowedDirs.forEach((i=>{let s=1,h=t.neighbours[i],e=null==h?void 0:h.neighbours[i];for(;(null==e?void 0:e.isOpen())&&!(null==h?void 0:h.isFork());)s+=1,h=e,e=h.neighbours[i];h&&!h.isDeadEnd()&&t.nextDecisionPoints.push({cell:h,distance:s,direction:i})}))}));const n=[];this.forEachCell((t=>{t.isOpen()&&n.push(t)})),n.forEach((t=>{n.forEach((i=>{if(t===i)return void t.mazeDistanceMap.set(i,0);const s=i.mazeDistanceMap.get(t);if(s)return void t.mazeDistanceMap.set(i,s);const h=[{distance:0,to:t}],e=[];let n=h.shift(),o=!1;for(;n;){const s=n.to,r=n.distance;if(s===i){t.mazeDistanceMap.set(i,r),o=!0;break}s.allowedDirs.forEach((t=>{const i=s.neighbours[t];i&&!e.includes(i)&&h.push({distance:r+1,to:i})})),e.push(s),n=h.shift()}o||t.mazeDistanceMap.set(i,1/0)}))}))}get rows(){return this.height/this.cellSize}get columns(){return this.width/this.cellSize}get centerCell(){return this.getCellAt({x:this.width/2,y:this.height/2})}getNeighbours(t){const i={},s=this.columns-1,h=this.rows-1;return t.y>0&&(i.u=this.cells[t.x][t.y-1]),t.x<s&&(i.r=this.cells[t.x+1][t.y]),t.y<h&&(i.d=this.cells[t.x][t.y+1]),t.x>0&&(i.l=this.cells[t.x-1][t.y]),i}getCellAt(t){return this.cells[Math.floor(t.x/this.cellSize)][Math.floor(t.y/this.cellSize)]}forEachCell(t){this.cells.forEach((i=>i.forEach((i=>t(i)))))}}class ct{constructor(t,i,s,h,e,n,o=!1){this.velX=0,this.velY=0,this.spriteFrameIndex=0,this.targetDir=null,this._orientation="d",this.id=t,this.x=i.x,this.y=i.y,this.sprite=s,this.width=e,this.height=n,this.speed=h,this.canFly=o}get center(){return{x:this.x+this.width/2,y:this.y+this.height/2}}set center(t){this.x=t.x-this.width/2,this.y=t.y-this.height/2}get top(){return this.y}set top(t){this.y=t}get right(){return this.x+this.width}set right(t){this.x=t-this.width}get bottom(){return this.y+this.height}set bottom(t){this.y=t-this.height}get left(){return this.x}set left(t){this.x=t}isMoving(){return!!this.velX||!!this.velY}get movingDirection(){return this.isMoving()?Math.abs(this.velY)>Math.abs(this.velX)?this.velY>0?"d":"u":this.velX>0?"r":"l":null}collidesWith(t){return Math.abs(this.center.x-t.center.x)<(this.width+t.width)/2&&Math.abs(this.center.y-t.center.y)<(this.height+t.height)/2}move(t,i=this.speed){this.velX="l"===t?-i:"r"===t?i:0,this.velY="u"===t?-i:"d"===t?i:0}get orientation(){return this._orientation=this.movingDirection||this._orientation,this._orientation}}class ut{constructor(t,i){this.preys=[],this.hunters=[],this.totalPreys=0,this.gamesPlayed=0,this.keys=[],this.initialized=!1,this.looping=!0,this.startedSince=null,this.pausedSince=null,this.overSince=null,this.durationPaused=0,this.onTick=i,this.canvas=t}get playTime(){return this.startedSince?(this.overSince||this.pausedSince||Date.now())-this.startedSince-this.durationPaused:0}get screen(){return this._screen||it.LOADING}set screen(t){t!==this.screen&&(this._screen=t,[it.LOADING,it.IN_GAME].includes(t)||(t===it.START?this.ctx.drawImage(this.startScreenImg,0,0,this.maze.width,this.maze.height):t===it.TUTORIAL?this.ctx.drawImage(this.tutorialScreenImg,0,0,this.maze.width,this.maze.height):t===it.PAUSE?(this.ctx.globalAlpha=.8,this.ctx.drawImage(this.pauseScreenImg,0,0,this.maze.width,this.maze.height),this.ctx.globalAlpha=1):t===it.GAME_OVER?this.ctx.drawImage(this.gameOverScreenImg,0,0,this.maze.width,this.maze.height):t===it.VICTORY&&this.ctx.drawImage(this.victoryScreenImg,0,0,this.maze.width,this.maze.height)))}async init(){this.maze=new at("\n+-------------------+\n|                   |\n| ##### ##### ##### |\n|     # #   # #     |\n| ### # # # # # ### |\n|   #     #     #   |\n|## # # ##### # # ##|\n|     #       #     |\n| # ### ## ## ### # |\n| #   # #   # #   # |\n| ###           ### |\n|     # #   # #     |\n| # ### ## ## ### # |\n| #               # |\n| #### ## # ## #### |\n|       # # #       |\n| # ### # # # ### # |\n| #   #   #   #   # |\n| ### # ##### # ### |\n|                   |\n+-------------------+\n",30),this.keys=[],this.canvas.width=this.maze.width,this.canvas.height=this.maze.height,this.ctx=this.canvas.getContext("2d"),document.body.addEventListener("keydown",(t=>{t.repeat||(["ArrowUp","ArrowRight","ArrowDown","ArrowLeft","w","a","s","d"].indexOf(t.key)>-1&&(this.keys[t.keyCode]=!0),"m"===t.key&&(et=!0,console.log("DEBUG (m)ode: on"),nt("Logger: that's right!")))})),document.body.addEventListener("keyup",(t=>{this.keys[t.keyCode]=!1,"p"===t.key&&this.togglePausedScreen(),"r"===t.key&&this.restart()," "===t.key&&this.nextScreen(),"v"===t.key&&this.gameWon(),"m"===t.key&&(et=!1,console.log("DEBUG (m)ode: off")),"g"===t.key&&console.log("==========GAME STATUS==========",this)})),Promise.all([rt("img/screens/screen-start.png"),rt("img/screens/screen-tutorial.png"),rt("img/screens/screen-pause.png"),rt("img/screens/screen-game-over.png"),rt("img/screens/screen-victory.png")]).then((([t,i,s,h,e])=>{this.startScreenImg=t,this.tutorialScreenImg=i,this.pauseScreenImg=s,this.gameOverScreenImg=h,this.victoryScreenImg=e,this.screen=it.START})),this.initialized=!0}nextScreen(){this.screen===it.START?this.screen=it.TUTORIAL:this.screen===it.TUTORIAL?this.start():[it.GAME_OVER,it.VICTORY].includes(this.screen)&&this.restart()}start(){this.initialized||this.init(),this.screen=it.IN_GAME,this.gamesPlayed+=1,this.tickSinceLastFrame=0,this.frameIndex=0;const t={image:ot("img/sprites/privacy_dev_walking.png"),frames:4,directional:!0,pauseOnIdle:!0};this.player=new ct(`g${this.gamesPlayed}-player`,this.maze.centerCell.origin,t,3,15,30);const i={image:ot("img/sprites/data.png"),frames:7,directional:!1,pauseOnIdle:!1},s=this.maze.cellSize,h=Array.from(this.maze.centerCell.mazeDistanceMap).filter((([,t])=>t>3)).map((([t])=>t));this.totalPreys=12,this.preys=[];for(let t=0;t<this.totalPreys;t++)this.preys.push(new ct(`g${this.gamesPlayed}-prey-${t}`,h[Math.floor(Math.random()*h.length)].origin,i,3,s,s));const e={image:ot("img/sprites/authority.png"),frames:4,directional:!0,pauseOnIdle:!1},n=2*this.maze.cellSize;this.hunters=[];for(let t=0;t<2;t++)this.hunters.push(new ct(`g${this.gamesPlayed}-hunter-${t}`,h[Math.floor(Math.random()*h.length)].origin,e,.5,n,n,!0));this.startedSince=Date.now(),this.overSince=null,this.pausedSince=null,this.looping=!0,this.durationPaused=0,this.tick()}preventNextTick(){this.nextAnimationFrameRequest&&cancelAnimationFrame(this.nextAnimationFrameRequest)}restart(){[it.IN_GAME,it.PAUSE,it.GAME_OVER,it.VICTORY].includes(this.screen)&&(this.preventNextTick(),this.start())}togglePausedScreen(){this.screen===it.IN_GAME?(this.screen=it.PAUSE,this.looping=!1,this.preventNextTick(),this.pausedSince=Date.now()):this.screen===it.PAUSE&&(this.pausedSince&&(this.durationPaused+=Date.now()-this.pausedSince),this.screen=it.IN_GAME,this.looping=!0,this.pausedSince=null,this.tick())}gameWon(){this.looping=!1,this.overSince=Date.now(),this.screen=it.VICTORY,this.preventNextTick()}gameLost(){this.looping=!1,this.overSince=Date.now(),this.screen=it.GAME_OVER,this.preventNextTick()}tick(){this.looping&&(this.nextAnimationFrameRequest=requestAnimationFrame((()=>this.tick())),this.tickSinceLastFrame+=1,this.tickSinceLastFrame>10&&(this.tickSinceLastFrame=0,this.frameIndex+=1),this.setPlayerIntent(this.player),this.applyFriction(this.player),this.preys.forEach((t=>{this.setPreyIntent(t,this.player,this.maze),this.updatePosition(t,this.maze)})),this.hunters.forEach((t=>{this.setHunterIntent(t,this.player,this.maze),this.updatePosition(t,this.maze)})),this.updatePosition(this.player,this.maze),this.preys=this.preys.filter((t=>!t.collidesWith(this.player))),this.draw(this.ctx,this.maze,this.player,this.preys,this.hunters),this.preys.length?this.hunters.some((t=>t.collidesWith(this.player)))&&this.gameLost():this.gameWon(),"function"==typeof this.onTick&&this.onTick.call(null,this.totalPreys-this.preys.length,this.totalPreys,Math.floor(this.playTime/1e3)))}wallColor(){return et?"gray":"#b31d25"}floorColor(){return et?"white":"#f8ca35"}draw(t,i,s,h,e){t.clearRect(0,0,i.width,i.height),t.fillStyle=this.floorColor(),t.fillRect(0,0,i.width,i.height);const n=i.getCellAt(s.center);et&&(t.fillStyle="darkorange",n.nextDecisionPoints.forEach((s=>{t.fillRect(s.cell.origin.x,s.cell.origin.y,i.cellSize,i.cellSize)}))),t.fillStyle=this.wallColor(),i.forEachCell((s=>{s.isWall()&&t.fillRect(s.origin.x,s.origin.y,i.cellSize,i.cellSize),et&&s.isOpen()&&t.fillText(Math.floor(s.mazeDistance(n)).toString(),s.origin.x,s.center.y,s.width)})),et&&(Object.values(n.neighbours).forEach((s=>{t.strokeStyle=s.isWall()?"red":"lime",t.strokeRect(s.origin.x,s.origin.y,i.cellSize,i.cellSize)})),t.strokeStyle="orange",t.strokeRect(n.origin.x,n.origin.y,i.cellSize,i.cellSize),t.strokeStyle="blue",t.strokeRect(s.x,s.y,s.width,s.height)),[s].concat(h,e).forEach((i=>{i.sprite.pauseOnIdle&&!i.isMoving()||(i.spriteFrameIndex=this.frameIndex%i.sprite.frames);const s=i.sprite.image.naturalWidth/i.sprite.frames,h=i.sprite.directional?i.sprite.image.naturalHeight/4:i.sprite.image.naturalHeight;t.drawImage(i.sprite.image,s*i.spriteFrameIndex,i.sprite.directional?h*ht[i.orientation]:0,s,h,i.center.x-s/2,i.bottom-h,s,h),et&&(t.strokeStyle="red",t.strokeText(i.id,i.left,i.top-5),i.target&&(t.strokeStyle="gold",t.beginPath(),t.moveTo(i.center.x,i.center.y),t.lineTo(i.target.center.x,i.target.center.y),t.stroke()))}))}updatePosition(t,i){if(!t.isMoving()||!t.movingDirection)return;const s=i.getCellAt(t.center);if(t.x+=t.velX,t.y+=t.velY,t.canFly)return;const h=t.movingDirection;i.getCellAt(t.center).isWall()&&("u"===h?(t.top=s.top,t.velY=0):"r"===h?(t.right=s.right,t.velX=0):"d"===h?(t.bottom=s.bottom,t.velY=0):"l"===h&&(t.left=s.left,t.velX=0));const e=i.getCellAt(t.center);Object.keys(e.neighbours).map((t=>t)).filter((i=>{const s=e.neighbours[i];return!s||s.isWall()&&t.collidesWith(s)})).forEach((i=>{i===h.toString()&&("u"===i?(t.top=e.top,t.velY=0):"r"===i?(t.right=e.right,t.velX=0):"d"===i?(t.bottom=e.bottom,t.velY=0):"l"===i&&(t.left=e.left,t.velX=0)),"u"===i&&["l","r"].indexOf(h)>-1&&(t.top=e.top,t.velY=0),"d"===i&&["l","r"].indexOf(h)>-1&&(t.bottom=e.bottom,t.velY=0),"r"===i&&["u","d"].indexOf(h)>-1&&(t.right=e.right,t.velX=0),"l"===i&&["u","d"].indexOf(h)>-1&&(t.left=e.left,t.velX=0)}))}applyFriction(t,i=.8,s=.1){t.velX*=i,t.velY*=i,Math.abs(t.velX)<s&&(t.velX=0),Math.abs(t.velY)<s&&(t.velY=0)}setPlayerIntent(t){(this.keys[38]||this.keys[87]&&t.velY>-t.speed)&&t.velY--,(this.keys[40]||this.keys[83]&&t.velY<t.speed)&&t.velY++,(this.keys[39]||this.keys[68]&&t.velX<t.speed)&&t.velX++,(this.keys[37]||this.keys[65]&&t.velX>-t.speed)&&t.velX--}setPreyIntent(t,i,s){const h=s.getCellAt(t.center),e=s.getCellAt(i.center),n=h.straightDistance(e),o=.1*Math.ceil(10/(.02*Math.pow(Math.max(0,n-3),2)+1));this.fleeSmartlyFrom(t,e,s,o*t.speed)}setHunterIntent(t,i,s){const h=s.getCellAt(i.center);t.target=h,this.goStraightTowards(t,t.target,t.speed)}fleeSmartlyFrom(t,i,s,h){const e=s.getCellAt(t.center),n=t.target===e&&t.target.pixelDistance(t)<t.speed;if(t.target&&!n)nt(`${t.id} At ${e}, WAITING to reach target, going ${t.targetDir}`);else{const s=[];let h;if(e.nextDecisionPoints.forEach((t=>{const h=t.cell.mazeDistance(i)-t.distance;h>=0&&s.push({dir:t.direction,cell:t.cell,profit:h})})),s.push({dir:null,cell:e,profit:e.mazeDistance(i)}),s.sort(((t,i)=>i.profit-t.profit)),null===s[0].dir)h=s[0],nt(`${t.id} At ${e}, opt chosen: STAY(null) for ${h.profit}, choices:`,s.map((t=>`${t.dir} -> ${t.cell} for ${t.profit}`)));else{const i=Math.random()>.7?Math.floor(Math.random()*s.length):0;h=s[i],nt(`${t.id} At ${e}, ${0===i?"opt":`subopt(${i})`} chosen: ${h.dir} -> ${h.cell} for ${h.profit}, choices:`,s.map((t=>`${t.dir} -> ${t.cell} for ${t.profit}`)))}t.target=h.cell,t.targetDir=h.dir}this.goStraightTowards(t,t.target,h)}goStraightTowards(t,i,s){const h=i.center.x-t.center.x,e=i.center.y-t.center.y,n=Math.sqrt(Math.pow(h,2)+Math.pow(e,2));t.velX=h*s/n,t.velY=e*s/n}}let dt=class extends V{constructor(){super(...arguments),this.gameDays=0,this.points=0,this.targetPoints=0}render(){return E`
      <canvas id='game' style='border: 1px solid #000; max-width: 100%; max-height: 100%;'></canvas>
      <div id='score' style='position: fixed; bottom: 0; padding: .5rem; background: #ffffff80'>
        <strong>Data gathered: </strong>
        <code id='score-points'>${this.points} / ${this.targetPoints}</code>
        <span> - </span>
        <strong>Days: </strong>
        <code id='score-time' style='color: ${this._daysToColor(this.gameDays)}; font-size: ${this._daysToFontSize(this.gameDays)}'>
          ${this.gameDays}
        </code>
      </div>
    `}_daysToColor(t){return t<15?"green":t<30?"darkorange":"red"}_daysToFontSize(t){return`${Math.max(10,Math.min(200,t))}px`}firstUpdated(){new ut(this.$canvas,((t,i,s)=>{this.gameDays=Math.floor(s),this.points=t,this.targetPoints=i})).init()}};st([
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function(t,i){return(({finisher:t,descriptor:i})=>(s,h)=>{var e;if(void 0===h){const h=null!==(e=s.originalKey)&&void 0!==e?e:s.key,n=null!=i?{kind:"method",placement:"prototype",key:h,descriptor:i(s.key)}:{...s,key:h};return null!=t&&(n.finisher=function(i){t(i,h)}),n}{const e=s.constructor;void 0!==i&&Object.defineProperty(s,h,i(h)),null==t||t(e,h)}})({descriptor:s=>{const h={get(){var i,s;return null!==(s=null===(i=this.renderRoot)||void 0===i?void 0:i.querySelector(t))&&void 0!==s?s:null},enumerable:!0,configurable:!0};if(i){const i="symbol"==typeof s?Symbol():"__"+s;h.get=function(){var s,h;return void 0===this[i]&&(this[i]=null!==(h=null===(s=this.renderRoot)||void 0===s?void 0:s.querySelector(t))&&void 0!==h?h:null),this[i]}}return h}})}("#game")],dt.prototype,"$canvas",void 0),st([Q()],dt.prototype,"gameDays",void 0),st([Q()],dt.prototype,"points",void 0),st([Q()],dt.prototype,"targetPoints",void 0),dt=st([(t=>i=>"function"==typeof i?((t,i)=>(window.customElements.define(t,i),i))(t,i):((t,i)=>{const{kind:s,elements:h}=i;return{kind:s,elements:h,finisher(i){window.customElements.define(t,i)}}})(t,i))("mini-game")],dt);export{dt as MiniGame};