import { UserButton } from "@clerk/clerk-react";

const UserAvatar = () => {
  return (
    <UserButton
      appearance={{
        elements: {
          avatarBox:
            "w-10 h-10 rounded-full ring-2 ring-primary/30 hover:ring-primary/60 transition",
          userButtonPopoverCard:
            "bg-popover border border-border shadow-xl",
          userButtonPopoverActionButton:
            "hover:bg-secondary/50",
        },
      }}
    />
  );
};

export default UserAvatar;
