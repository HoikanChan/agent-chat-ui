import { useMemo } from "react";
import { useStore } from "~/core/store";
import { parseJSON } from "~/core/utils/json";
import { Tooltip } from "./tooltip";
import { WarningFilled } from "@ant-design/icons";
import { useTranslations } from "~/lib/i18n-react";

export const Link = ({
  href,
  children,
  checkLinkCredibility = false,
}: {
  href: string | undefined;
  children: React.ReactNode;
  checkLinkCredibility: boolean;
}) => {

  const t = useTranslations("common");
  return (
    <span className="inline-flex items-center gap-1.5">
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
     
    </span>
  );
};
