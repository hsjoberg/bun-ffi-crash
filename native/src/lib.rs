use std::mem;
use std::thread;
use std::time::Duration;

const WORKERS: usize = 1;

type OnResponse = unsafe extern "C" fn();

fn invoke_callback(on_response: OnResponse) {
    unsafe {
        on_response();
    }
}

fn run_worker(on_response: OnResponse, initial_burst: usize, interval_ms: u64) {
    for _ in 0..initial_burst {
        invoke_callback(on_response);
    }

    loop {
        if interval_ms == 0 {
            thread::yield_now();
        } else {
            thread::sleep(Duration::from_millis(interval_ms));
        }

        invoke_callback(on_response);
    }
}

#[export_name = "StartCallbackStress"]
pub extern "C" fn start_callback_stress(
    callback_ptr: usize,
    initial_burst: i32,
    interval_ms: i32,
) -> i32 {
    if callback_ptr == 0 || initial_burst < 0 || interval_ms < 0 {
        return 0;
    }

    let on_response = unsafe { mem::transmute::<usize, OnResponse>(callback_ptr) };

    for _ in 0..WORKERS {
        thread::spawn(move || {
            run_worker(on_response, initial_burst as usize, interval_ms as u64);
        });
    }

    1
}
