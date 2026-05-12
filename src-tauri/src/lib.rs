// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn save_excel_file(file_name: String, bytes: Vec<u8>) -> Result<String, String> {
    let safe_name = file_name
        .chars()
        .map(|ch| match ch {
            '\\' | '/' | ':' | '*' | '?' | '"' | '<' | '>' | '|' => '_',
            _ => ch,
        })
        .collect::<String>();

    let base_dir = std::env::var_os("USERPROFILE")
        .map(std::path::PathBuf::from)
        .or_else(|| std::env::var_os("HOME").map(std::path::PathBuf::from))
        .unwrap_or_else(|| std::env::current_dir().unwrap_or_else(|_| ".".into()));
    let downloads_dir = base_dir.join("Downloads");
    let target_dir = if downloads_dir.exists() {
        downloads_dir
    } else {
        base_dir
    };
    let target_path = target_dir.join(safe_name);

    std::fs::write(&target_path, bytes).map_err(|err| err.to_string())?;
    Ok(target_path.to_string_lossy().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, save_excel_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
