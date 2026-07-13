"use client";

import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuEye, LuEyeOff } from "react-icons/lu";
import { LoadingButton } from "@/components/loading-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { translateBackendError } from "@/lib/backend-errors";
import { testSyncConnection as testSyncServerConnection } from "@/lib/sync-utils";
import { showErrorToast, showSuccessToast } from "@/lib/toast-utils";
import type { SyncSettings } from "@/types";

interface SyncConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SyncConfigDialog({ isOpen, onClose }: SyncConfigDialogProps) {
  const { t } = useTranslation();
  const [serverUrl, setServerUrl] = useState("");
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const settings = await invoke<SyncSettings>("get_sync_settings");
      setServerUrl(settings.sync_server_url ?? "");
      setToken(settings.sync_token ?? "");
    } catch (error) {
      showErrorToast(translateBackendError(t, error));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (isOpen) void loadSettings();
  }, [isOpen, loadSettings]);

  const testConnection = async () => {
    if (!serverUrl || !token) {
      showErrorToast(t("sync.config.serverUrlRequired"));
      return;
    }
    setIsTesting(true);
    try {
      if (!(await testSyncServerConnection(serverUrl, token))) {
        throw new Error(t("sync.config.serverError"));
      }
      showSuccessToast(t("sync.config.connectionSuccess"));
    } catch (error) {
      showErrorToast(
        error instanceof Error ? error.message : t("sync.config.connectFailed"),
      );
    } finally {
      setIsTesting(false);
    }
  };

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
      onClose();
    } catch (error) {
      showErrorToast(translateBackendError(t, error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("sync.title")}</DialogTitle>
          <DialogDescription>{t("sync.description")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="sync-config-url">{t("sync.serverUrl")}</Label>
            <Input
              id="sync-config-url"
              value={serverUrl}
              placeholder={t("sync.serverUrlPlaceholder")}
              disabled={isLoading}
              onChange={(event) => setServerUrl(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sync-config-token">{t("sync.token")}</Label>
            <div className="flex gap-2">
              <Input
                id="sync-config-token"
                type={showToken ? "text" : "password"}
                value={token}
                placeholder={t("sync.tokenPlaceholder")}
                disabled={isLoading}
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
        </div>
        <DialogFooter>
          <LoadingButton
            variant="outline"
            isLoading={isTesting}
            disabled={!serverUrl || !token}
            onClick={() => void testConnection()}
          >
            {t("sync.config.testConnection")}
          </LoadingButton>
          <LoadingButton isLoading={isSaving} onClick={() => void save()}>
            {t("common.buttons.save")}
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
