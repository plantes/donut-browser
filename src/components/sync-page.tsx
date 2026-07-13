"use client";

import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuEye, LuEyeOff, LuRefreshCw } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { translateBackendError } from "@/lib/backend-errors";
import { testSyncConnection as testSyncServerConnection } from "@/lib/sync-utils";
import { showErrorToast, showSuccessToast } from "@/lib/toast-utils";
import { cn } from "@/lib/utils";
import type { SyncSettings } from "@/types";

interface SyncPageProps {
  isOpen: boolean;
  onClose: () => void;
  subPage?: boolean;
}

type ConnectionStatus = "unknown" | "testing" | "connected" | "error";

export function SyncPage({ isOpen, onClose, subPage }: SyncPageProps) {
  const { t } = useTranslation();
  const [serverUrl, setServerUrl] = useState("");
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>("unknown");
  const statusLabel =
    status === "connected"
      ? t("sync.status.connected")
      : status === "error"
        ? t("sync.status.error")
        : status === "testing"
          ? t("sync.status.syncing")
          : t("sync.status.disconnected");

  const testConnection = useCallback(
    async (url: string, accessToken: string) => {
      setStatus("testing");
      try {
        const connected = await testSyncServerConnection(url, accessToken);
        setStatus(connected ? "connected" : "error");
        return connected;
      } catch {
        setStatus("error");
        return false;
      }
    },
    [],
  );

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const settings = await invoke<SyncSettings>("get_sync_settings");
      setServerUrl(settings.sync_server_url ?? "");
      setToken(settings.sync_token ?? "");
      if (settings.sync_server_url && settings.sync_token) {
        void testConnection(settings.sync_server_url, settings.sync_token);
      } else {
        setStatus("unknown");
      }
    } catch (error) {
      showErrorToast(translateBackendError(t, error));
    } finally {
      setIsLoading(false);
    }
  }, [t, testConnection]);

  useEffect(() => {
    if (isOpen) void loadSettings();
  }, [isOpen, loadSettings]);

  const save = async () => {
    if (!serverUrl || !token) {
      showErrorToast(t("sync.config.serverUrlRequired"));
      return;
    }
    setIsSaving(true);
    try {
      await invoke("save_sync_settings", {
        syncServerUrl: serverUrl,
        syncToken: token,
      });
      await invoke("restart_sync_service");
      showSuccessToast(t("sync.config.settingsSaved"));
      void testConnection(serverUrl, token);
    } catch (error) {
      showErrorToast(translateBackendError(t, error));
    } finally {
      setIsSaving(false);
    }
  };

  const disconnect = async () => {
    setIsSaving(true);
    try {
      await invoke("save_sync_settings", {
        syncServerUrl: null,
        syncToken: null,
      });
      await invoke("restart_sync_service");
      setServerUrl("");
      setToken("");
      setStatus("unknown");
      showSuccessToast(t("sync.config.disconnected"));
    } catch (error) {
      showErrorToast(translateBackendError(t, error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose} subPage={subPage}>
      <DialogContent className="flex max-h-[calc(100vh-4rem)] max-w-2xl flex-col">
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4",
            subPage && "mx-auto w-full max-w-2xl",
          )}
        >
          <div>
            <h2 className="text-lg font-semibold">{t("sync.title")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("sync.description")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sync-server-url">{t("sync.serverUrl")}</Label>
            <Input
              id="sync-server-url"
              value={serverUrl}
              placeholder={t("sync.serverUrlPlaceholder")}
              disabled={isLoading || isSaving}
              onChange={(event) => setServerUrl(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sync-token">{t("sync.token")}</Label>
            <div className="flex gap-2">
              <Input
                id="sync-token"
                type={showToken ? "text" : "password"}
                value={token}
                placeholder={t("sync.tokenPlaceholder")}
                disabled={isLoading || isSaving}
                onChange={(event) => setToken(event.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowToken((value) => !value)}
              >
                {showToken ? <LuEyeOff /> : <LuEye />}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span
              className={cn(
                "size-2 rounded-full bg-muted-foreground",
                status === "connected" && "bg-success",
                status === "error" && "bg-destructive",
              )}
            />
            {statusLabel}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={!serverUrl || !token || status === "testing"}
              onClick={() => void testConnection(serverUrl, token)}
            >
              <LuRefreshCw
                className={cn(status === "testing" && "animate-spin")}
              />
              {t("sync.config.testConnection")}
            </Button>
            <Button disabled={isSaving} onClick={() => void save()}>
              {t("common.buttons.save")}
            </Button>
            {(serverUrl || token) && (
              <Button
                variant="destructive"
                disabled={isSaving}
                onClick={() => void disconnect()}
              >
                {t("sync.config.disconnect")}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
