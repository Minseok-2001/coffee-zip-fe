import yt_dlp

def download_youtube_short(video_url, output_path='.'):
    """
    유튜브 숏츠(또는 일반 영상)를 최고 화질의 MP4로 다운로드합니다.
    
    :param video_url: 다운로드할 유튜브 링크
    :param output_path: 저장할 폴더 경로 (기본값: 현재 폴더 '.')
    """
    # yt-dlp 옵션 설정
    ydl_opts = {
        'format': 'bestvideo[ext=mp4]/bestvideo',  # 소리(오디오)를 제외하고 비디오만 다운받습니다.
        'outtmpl': f'{output_path}/%(title)s.%(ext)s', 
        'quiet': False, 
    }
    # ydl_opts = {
    #     # 비디오와 오디오를 최고 화질의 mp4/m4a로 받아서 병합하거나, 불가능하면 가장 좋은 단일 mp4 파일로 다운로드
    #     'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
    #     # 다운로드된 파일의 이름 설정 (영상 제목.확장자)
    #     'outtmpl': f'{output_path}/%(title)s.%(ext)s', 
    #     # 진행 상황을 콘솔에 출력 (False면 출력함)
    #     'quiet': False, 
    #     # (선택) FFmpeg가 시스템에 설치되어 있지 않아 발생하는 경고를 무시하려면 아래 옵션을 추가할 수 있습니다.
    #     # 고화질 영상(비디오+오디오 병합)을 위해서는 FFmpeg 설치가 권장됩니다.
    # }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            print(f"🔄 다운로드 준비 중: {video_url}")
            ydl.download([video_url])
            print("✅ 다운로드 완료!")
    except Exception as e:
        print(f"❌ 다운로드 중 오류 발생: {e}")


# ========== 실행 부분 ==========
# 이곳 변수에 원하는 유튜브 링크를 입력하세요!
url = "https://www.youtube.com/shorts/DFBUuQPN7yY"

# 다운로드 실행 (현재 폴더에 저장됩니다)
download_youtube_short(url)
