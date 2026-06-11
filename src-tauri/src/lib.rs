use std::fs;
use std::path::{Path, PathBuf};
use serde_json::{json, Value};
use rfd::FileDialog;

fn resolve_workspace(workspace_root: &str) -> Result<PathBuf, String> {
    let path = Path::new(workspace_root);
    if !path.exists() {
        fs::create_dir_all(path)
            .map_err(|e| format!("Failed to create workspace directory: {}", e))?;
    }
    path.canonicalize()
        .map_err(|e| format!("Failed to resolve workspace path: {}", e))
}

#[tauri::command]
fn select_directory(default_path: Option<String>) -> Result<String, String> {
    let mut dialog = FileDialog::new();
    if let Some(ref path_str) = default_path {
        if !path_str.is_empty() {
            dialog = dialog.set_directory(Path::new(path_str));
        }
    }
    
    if let Some(folder_path) = dialog.pick_folder() {
        Ok(folder_path.to_string_lossy().replace('\\', "/"))
    } else {
        Err("Dialog cancelled".to_string())
    }
}

// Recursively get files (excluding node_modules, .git, dist, .system_generated, public)
fn get_files_rec(dir: &Path, root: &Path, files_list: &mut Vec<Value>) -> Result<(), std::io::Error> {
    if !dir.exists() {
        return Ok(());
    }
    
    for entry in fs::read_dir(dir)? {
        let entry = entry?;
        let file_name = entry.file_name();
        let file_name_str = file_name.to_string_lossy();
        
        if file_name_str == "node_modules" 
            || file_name_str == ".git" 
            || file_name_str == "dist" 
            || file_name_str == ".system_generated" 
            || file_name_str == "public" 
        {
            continue;
        }
        
        let path = entry.path();
        if path.is_dir() {
            get_files_rec(&path, root, files_list)?;
        } else {
            let relative_path = path.strip_prefix(root)
                .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))?;
            let relative_path_str = relative_path.to_string_lossy().replace('\\', "/");
            let size = entry.metadata()?.len();
            
            files_list.push(json!({
                "name": file_name_str,
                "path": relative_path_str,
                "size": size
            }));
        }
    }
    Ok(())
}

#[tauri::command]
fn get_files(workspace_root: String) -> Result<Vec<Value>, String> {
    let root_path = resolve_workspace(&workspace_root)?;
    let mut files_list = Vec::new();
    get_files_rec(&root_path, &root_path, &mut files_list)
        .map_err(|e| format!("Failed to read files: {}", e))?;
    Ok(files_list)
}

#[tauri::command]
fn read_file(workspace_root: String, file_path: String) -> Result<String, String> {
    let root_path = resolve_workspace(&workspace_root)?;
    let full_path = root_path.join(&file_path);
    
    // Canonicalize target file path to prevent directory traversal
    let canonical_path = full_path.canonicalize()
        .map_err(|e| format!("File not found or invalid: {}", e))?;
        
    if !canonical_path.starts_with(&root_path) {
        return Err("Access Denied: Path outside workspace".to_string());
    }
    
    let content = fs::read_to_string(&canonical_path)
        .map_err(|e| format!("Failed to read file: {}", e))?;
        
    Ok(content)
}

#[tauri::command]
fn save_file(workspace_root: String, file_path: String, content: String) -> Result<String, String> {
    let root_path = resolve_workspace(&workspace_root)?;
    
    // Resolve absolute path
    let full_path = root_path.join(&file_path);
    
    // If the file exists, we check if it is outside workspace
    if full_path.exists() {
        let canonical_path = full_path.canonicalize()
            .map_err(|e| format!("Failed to resolve file path: {}", e))?;
        if !canonical_path.starts_with(&root_path) {
            return Err("Access Denied: Path outside workspace".to_string());
        }
    } else {
        // If it doesn't exist, check parent path
        if let Some(parent) = full_path.parent() {
            if parent.exists() {
                let canonical_parent = parent.canonicalize()
                    .map_err(|e| format!("Failed to resolve parent path: {}", e))?;
                if !canonical_parent.starts_with(&root_path) {
                    return Err("Access Denied: Path outside workspace".to_string());
                }
            }
        }
    }
    
    // Create directory if not exists
    if let Some(parent) = full_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directories: {}", e))?;
    }
    
    fs::write(&full_path, content)
        .map_err(|e| format!("Failed to write file: {}", e))?;
        
    Ok(format!("File saved successfully to {}", file_path))
}

#[tauri::command]
fn browse_folders(path: Option<String>) -> Result<Value, String> {
    let target_path_str = path.unwrap_or_else(|| {
        std::env::var("USERPROFILE")
            .or_else(|_| std::env::var("HOME"))
            .unwrap_or_else(|_| ".".to_string())
    });
    
    let target_path = Path::new(&target_path_str);
    
    // If it doesn't exist, let's default to user profile or current dir
    let resolved_path = if target_path.exists() {
        target_path.canonicalize()
            .map_err(|e| format!("Invalid path '{}': {}", target_path_str, e))?
    } else {
        let fallback = std::env::var("USERPROFILE")
            .or_else(|_| std::env::var("HOME"))
            .unwrap_or_else(|_| ".".to_string());
        Path::new(&fallback).canonicalize()
            .map_err(|e| format!("Invalid path and fallback failed: {}", e))?
    };
        
    let parent_path = resolved_path.parent()
        .unwrap_or(&resolved_path)
        .to_path_buf();
        
    let mut subfolders = Vec::new();
    let entries = fs::read_dir(&resolved_path)
        .map_err(|e| format!("Failed to read directory: {}", e))?;
        
    for entry in entries {
        if let Ok(entry) = entry {
            let file_name = entry.file_name();
            let file_name_str = file_name.to_string_lossy();
            let path = entry.path();
            
            if path.is_dir() && !file_name_str.starts_with('.') && file_name_str != "node_modules" && file_name_str != ".git" {
                subfolders.push(file_name_str.into_owned());
            }
        }
    }
    subfolders.sort();
    
    Ok(json!({
        "currentPath": resolved_path.to_string_lossy().replace('\\', "/"),
        "parentPath": parent_path.to_string_lossy().replace('\\', "/"),
        "subfolders": subfolders
    }))
}

#[tauri::command]
fn create_folder(parent_path: String, folder_name: String) -> Result<String, String> {
    let parent = Path::new(&parent_path);
    let new_folder = parent.join(&folder_name);
    
    fs::create_dir_all(&new_folder)
        .map_err(|e| format!("Failed to create directory: {}", e))?;
        
    Ok(new_folder.to_string_lossy().replace('\\', "/"))
}

#[tauri::command]
fn delete_file(workspace_root: String, file_path: String) -> Result<String, String> {
    let root_path = resolve_workspace(&workspace_root)?;
    let full_path = root_path.join(&file_path);
    let canonical_path = full_path.canonicalize()
        .map_err(|e| format!("File not found: {}", e))?;
    if !canonical_path.starts_with(&root_path) {
        return Err("Access Denied: Path outside workspace".to_string());
    }
    fs::remove_file(&canonical_path)
        .map_err(|e| format!("Failed to delete file: {}", e))?;
    Ok(format!("Deleted {}", file_path))
}

#[tauri::command]
fn rename_file(workspace_root: String, old_path: String, new_path: String) -> Result<String, String> {
    let root_path = resolve_workspace(&workspace_root)?;
    let old_full = root_path.join(&old_path);
    let new_full = root_path.join(&new_path);
    let canonical_old = old_full.canonicalize()
        .map_err(|e| format!("Source file not found: {}", e))?;
    if !canonical_old.starts_with(&root_path) {
        return Err("Access Denied: Source path outside workspace".to_string());
    }
    // Ensure new path stays inside workspace
    if let Some(parent) = new_full.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create parent dirs: {}", e))?;
    }
    fs::rename(&canonical_old, &new_full)
        .map_err(|e| format!("Failed to rename file: {}", e))?;
    Ok(format!("Renamed {} to {}", old_path, new_path))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            select_directory,
            get_files,
            read_file,
            save_file,
            browse_folders,
            create_folder,
            delete_file,
            rename_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
