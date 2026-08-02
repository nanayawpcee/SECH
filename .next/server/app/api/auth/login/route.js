"use strict";(()=>{var e={};e.id=873,e.ids=[873],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},3820:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>g,patchFetch:()=>h,requestAsyncStorage:()=>l,routeModule:()=>p,serverHooks:()=>d,staticGenerationAsyncStorage:()=>c});var a={};r.r(a),r.d(a,{POST:()=>u});var s=r(9303),n=r(8716),o=r(3131),i=r(7070);async function u(e){try{let{identifier:t,password:r}=await e.json(),a=await fetch("https://sech-gh.org/graphql",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:`
          mutation LoginUser($username: String!, $password: String!) {
            login(input: { username: $username, password: $password }) {
              authToken
              user {
                id
                name
                email
              }
            }
          }
        `,variables:{username:t,password:r}})}),{data:s,errors:n}=await a.json();if(n||!s?.login?.authToken){let e=n?.[0]?.message||"Invalid credentials.";return e=e.replace(/<[^>]+>/g,"").replace(/&lt;[^&]+&gt;/g,"").replace(/&amp;/g,"&"),i.NextResponse.json({error:e},{status:401})}let o=i.NextResponse.json({success:!0,user:s.login.user});return o.cookies.set("admin_token",s.login.authToken,{httpOnly:!0,secure:!0,sameSite:"strict",path:"/",maxAge:7200}),o}catch(e){return i.NextResponse.json({error:"Server authentication error"},{status:500})}}let p=new s.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/auth/login/route",pathname:"/api/auth/login",filename:"route",bundlePath:"app/api/auth/login/route"},resolvedPagePath:"/Users/NanaYawPcee/Development/Projects/WebDevs/deploy-vercel/src/app/api/auth/login/route.ts",nextConfigOutput:"",userland:a}),{requestAsyncStorage:l,staticGenerationAsyncStorage:c,serverHooks:d}=p,g="/api/auth/login/route";function h(){return(0,o.patchFetch)({serverHooks:d,staticGenerationAsyncStorage:c})}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[276,972],()=>r(3820));module.exports=a})();