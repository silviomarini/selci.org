import { createCustodianMiddleware } from "@silviomarini/custodian";
import { custodianApp } from "@/lib/custodian";

export const proxy = createCustodianMiddleware(custodianApp.config);

export const config = {
  matcher: ["/custodian/:path*"],
};
