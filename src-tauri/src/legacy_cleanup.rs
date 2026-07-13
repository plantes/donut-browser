use std::collections::HashSet;
use std::fs;
use std::path::Path;

use crate::profile::ProfileManager;
use crate::proxy_manager::PROXY_MANAGER;

const CLOUD_CREDENTIAL_FILES: [&str; 4] = [
  "cloud_access_token.dat",
  "cloud_refresh_token.dat",
  "cloud_sync_token.dat",
  "cloud_auth_state.json",
];
const LEGACY_CLOUD_PROXY_ID: &str = "cloud-included-proxy";

/// Remove credentials and managed resources left by releases that supported
/// Donut Cloud. This is intentionally idempotent and never contacts a server.
pub fn remove_legacy_cloud_state() {
  let settings_dir = crate::app_dirs::settings_dir();
  remove_credential_files(&settings_dir);

  let mut cloud_proxy_ids = HashSet::from([LEGACY_CLOUD_PROXY_ID.to_string()]);
  cloud_proxy_ids.extend(
    PROXY_MANAGER
      .get_stored_proxies()
      .into_iter()
      .filter(|proxy| proxy.is_cloud_managed || proxy.is_cloud_derived)
      .map(|proxy| proxy.id),
  );

  let manager = ProfileManager::instance();
  match manager.list_profiles() {
    Ok(profiles) => {
      for mut profile in profiles {
        if profile
          .proxy_id
          .as_ref()
          .is_some_and(|id| cloud_proxy_ids.contains(id))
        {
          profile.proxy_id = None;
          profile.updated_at = Some(crate::proxy_manager::now_secs());
          if let Err(error) = manager.save_profile(&profile) {
            log::warn!(
              "Failed to detach removed cloud proxy from profile {}: {error}",
              profile.id
            );
          }
        }
      }
    }
    Err(error) => log::warn!("Failed to inspect profiles during cloud cleanup: {error}"),
  }

  PROXY_MANAGER.remove_cloud_proxies();
}

fn remove_credential_files(settings_dir: &Path) {
  for name in CLOUD_CREDENTIAL_FILES {
    let path = settings_dir.join(name);
    if let Err(error) = fs::remove_file(&path) {
      if error.kind() != std::io::ErrorKind::NotFound {
        log::warn!(
          "Failed to remove legacy cloud credential {}: {error}",
          path.display()
        );
      }
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn credential_cleanup_is_idempotent() {
    let dir = std::env::temp_dir().join(format!("donut-legacy-cleanup-{}", uuid::Uuid::new_v4()));
    fs::create_dir_all(&dir).unwrap();
    for name in CLOUD_CREDENTIAL_FILES {
      fs::write(dir.join(name), b"legacy").unwrap();
    }
    let retained = dir.join("sync_token.dat");
    fs::write(&retained, b"self-hosted").unwrap();

    remove_credential_files(&dir);
    remove_credential_files(&dir);

    for name in CLOUD_CREDENTIAL_FILES {
      assert!(!dir.join(name).exists());
    }
    assert_eq!(fs::read(&retained).unwrap(), b"self-hosted");
    fs::remove_dir_all(dir).unwrap();
  }
}
