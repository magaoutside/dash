interface GameModeCardProps {
  backgroundImage: string;
  onClick?: () => void;
}

export default function GameModeCard({ backgroundImage, onClick }: GameModeCardProps) {
  return (
    <div 
      className="relative w-full max-w-sm sm:max-w-md md:max-w-lg h-32 sm:h-36 md:h-40 lg:h-44 rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer transform transition-all duration-200 hover:scale-105 mx-auto"
      onClick={onClick}
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      
      
    </div>
  );
}
